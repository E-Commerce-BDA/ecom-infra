# ecom-infra

Local harness, Kafka/SQS provisioning and Terraform for the e-commerce
platform. Nothing here is application code.

## 1. One file, one project

`docker-compose.yml` is the **only** compose file in the workspace. It replaces
`docker-compose.kafka.yml` at the repo root and the per-service files that used
to live in `auth-svc/` and `cms-svc/`; those files and their volumes are gone.

Compose does not nest containers. The Docker Desktop row called `e-commerce` is
a **project group** — a label, not a parent container. Every service below is a
sibling container with its own image, volume, restart policy and healthcheck,
and `name: e-commerce` only pins the group row and the volume prefix so the
stack is identical no matter which directory you run it from.

`container_name` values are deliberately stable (`ecom-pg`, `ecom-redis`,
`ecom-mongo`, `ecom-kafka`, `ecom-localstack`, `ecom-mailpit`) so every
documented `docker exec ecom-pg psql ...` command keeps working.

| Container | Image | Host port | Why it exists |
|---|---|---|---|
| `ecom-pg` | `postgres:16` | 5433 | auth, cart, catalog, order, search schemas + `*_test` databases |
| `ecom-redis` | `redis:7-alpine` | 6379 | catalog cache, cart/order idempotency keys (AOF on) |
| `ecom-mongo` | `mongo:8.0` | 27018 | cms-svc; single-node replica set `rs0` so `cms_outbox` can run a transaction |
| `ecom-mongo-rs-init` | `mongo:8.0` | — | one-shot `rs.initiate`; exits 0 and stays exited |
| `ecom-kafka` | `apache/kafka:3.7.0` | 9092 | KRaft single broker, auto-create **off** |
| `ecom-localstack` | `localstack/localstack:3.8` | 4566 | SQS (the three task queues) + IAM (for `terraform apply`) |
| `ecom-mailpit` | `axllent/mailpit:v1.21` | 1025 / 8025 | SMTP sink + web UI for notify-svc |

Host ports match the values already in the six services' `.env` files, so this
file changed no application configuration.

## 2. Start, stop, verify

```powershell
cd E:\E-Commerce\ecom-infra
pnpm install --ignore-workspace          # pulls the pinned @ecom/contracts tarball
pnpm up                                  # docker compose up -d
pnpm verify                              # scripts/verify-stack.mjs — 31 checks
pnpm down                                # keep volumes
docker compose down -v                   # drop the data too
```

`verify` is the acceptance gate for this repo: it checks all six containers are
healthy, `mongo-rs-init` exited 0, the Postgres schema/table floors, a Mongo
transaction, the three SQS queues and their redrive policies, and that Mailpit
accepts and stores an SMTP message.

### Reset

| Goal | Command | Keeps data? |
|---|---|---|
| Restart the stack | `docker compose restart` | yes |
| Recreate containers, keep volumes | `docker compose up -d --force-recreate` | yes |
| Stop, keep volumes | `pnpm down` | yes |
| Full reset (loses the migrated databases) | `docker compose down -v` then `pnpm up` | **no** |
| Rebuild only the queues | `docker compose rm -sf localstack` then `docker compose up -d localstack` | yes (init hook reruns) |
| Rebuild only the replica set | `docker compose down` then delete `e-commerce_mongo-data`, `pnpm up` | mongo only |

After a full reset the Postgres databases are empty: re-apply the schema files in
each service's `db/` directory before running e2e suites again.

## 3. Kafka topics

Topics are **not** created by hand and not by the broker. `EVENT_TOPICS` in
`@ecom/contracts` is the registry; the script is the only writer.

```powershell
pnpm topics:provision   # create missing topics, raise partitions, fix retention
pnpm topics:smoke       # 28 checks: shape, keyed partitioning, auto-create off, no strays
```

`topics:provision` is idempotent: a second run reports
`nothing to do: 22 topics already match the registry`. It never lowers a
partition count (Kafka cannot) — it reports the conflict instead. Retention comes
from the registry (`7d` → `604800000`).

Auto-create is disabled in the broker config on purpose: an accidentally created
topic has one partition and no `.dlq` twin.

## 4. Task queues (SQS)

`localstack/init/ready.d/10-sqs-queues.sh` runs once the SQS API is up and
creates `notify-send-email`, `import-process-row`, `media-resize-image`, each
with a `-dlq` twin, `maxReceiveCount 5`, 60s visibility and 14d retention. The
names are hyphenated because SQS accepts only alphanumerics, hyphens and
underscores; a dot is legal only as a trailing `.fifo`.

In AWS the same objects come from Terraform:

```powershell
docker run --rm -v "${PWD}/aws:/tf" -w /tf hashicorp/terraform:1.9 init
docker run --rm -v "${PWD}/aws:/tf" -w /tf hashicorp/terraform:1.9 validate

# exercise a real apply against LocalStack without touching the dev queues
docker run --rm -v "${PWD}/aws:/tf" -w /tf `
  -e AWS_ACCESS_KEY_ID=test -e AWS_SECRET_ACCESS_KEY=test hashicorp/terraform:1.9 `
  apply -auto-approve -var endpoint=http://host.docker.internal:4566 -var queue_prefix=tfcheck-
```

`aws/` holds three queues + three DLQs and one least-privilege role per queue
(send/consume on its own ARN, read-only on its DLQ). Leaving `endpoint` empty
points the same configuration at real AWS; `queue_prefix` exists so a test apply
can never collide with the dev queues.

## 5. Contract pinning

`package.json` pins an exact tarball (`file:../ecom-contracts/ecom-contracts-1.8.0.tgz`),
never a `^` range. Bumping the contracts means: copy the new tarball into
`ecom-contracts/`, update the pin here, then `pnpm install --ignore-workspace`.
The root `pnpm-workspace.yaml` excludes `ecom-infra/**` so this install stays
independent of the services.

## 6. Notes that cost time to learn

- **Mongo needs `?directConnection=true` from the host.** The replica set
  advertises itself as `mongo:27017`, a name that only resolves inside
  `ecom-net`. A plain `mongodb://127.0.0.1:27018/ecom_cms` fails with
  `getaddrinfo ENOTFOUND mongo`.
- **Run Kafka tooling through `docker exec`.** There is no host Kafka client:
  `docker exec ecom-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list`.
- **`kafka-console-producer.sh` exits 0 even when the produce is rejected.** Any
  check on it has to read the output for `UNKNOWN_TOPIC_OR_PARTITION`; that is
  why `scripts/kafka.mjs` exposes `kafkaCapture()` next to `kafka()`.
- **Mailpit recipients are positional**: `docker exec -i ecom-mailpit /mailpit
  sendmail -f probe@ecom.test dev@ecom.test` — there is no `--to` flag.
- `pgdata` holds the migrated auth/cart/catalog/order/search databases. It is
  the one volume in this stack that is not disposable.
