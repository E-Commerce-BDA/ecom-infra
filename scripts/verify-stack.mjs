#!/usr/bin/env node
/**
 * Proves the acceptance criteria of inf-001 against the running stack.
 *
 *   node scripts/verify-stack.mjs
 *
 * Everything is checked through the containers' own clients (psql, mongosh,
 * boto3 inside LocalStack), so the host needs no drivers, no AWS CLI and no
 * credentials. Exit code is non-zero on the first failed group.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const results = [];
const record = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const docker = (args, options = {}) =>
  execFileSync('docker', args, { encoding: 'utf8', ...options }).trim();

// Every compose call runs from the repo root, so `name: e-commerce` wins and the
// project is the same one `docker compose up` created.
const compose = (args) => docker(['compose', ...args], { cwd: ROOT });

const psql = (database, sql) =>
  docker(['exec', 'ecom-pg', 'psql', '-U', process.env.POSTGRES_USER ?? 'ecom', '-d', database, '-tAc', sql]);

const mongosh = (script) =>
  docker(['exec', 'ecom-mongo', 'mongosh', '--quiet', '--eval', script]);

/** Container health straight from compose, so "up" means "healthy". */
function checkContainers() {
  // --all so the one-shot mongo-rs-init container is visible after it exits.
  const raw = compose(['ps', '--all', '--format', 'json']);
  const rows = raw.split('\n').filter(Boolean).map((line) => JSON.parse(line));
  const expected = ['postgres', 'redis', 'mongo', 'kafka', 'localstack', 'mailpit'];
  const byService = Object.fromEntries(rows.map((row) => [row.Service, row]));

  for (const service of expected) {
    const row = byService[service];
    const state = row?.State ?? 'missing';
    const health = row?.Health ? ` (${row.Health})` : '';
    record(`${service} running and healthy`, state === 'running' && (row.Health ?? 'healthy') === 'healthy', `${state}${health}`);
  }

  const init = byService['mongo-rs-init'];
  record('mongo-rs-init finished cleanly', init?.ExitCode === 0, `exit ${init?.ExitCode ?? 'missing'}`);
  record('six dependencies, one project', rows.every((row) => (row.Project ?? '') === 'e-commerce'), [...new Set(rows.map((r) => r.Project))].join(','));
}

/** The tables that already existed must survive the move into the new volume. */
function checkPostgres() {
  const sql = `select table_schema, count(*) from information_schema.tables
                where table_schema in ('auth','cart','catalog','order','search')
                group by table_schema order by table_schema`;
  const actual = Object.fromEntries(
    psql('ecom', sql).split('\n').filter(Boolean).map((line) => line.split('|')),
  );
  const minimum = { auth: 7, cart: 6, catalog: 17, order: 8, search: 2 };

  for (const [schema, floor] of Object.entries(minimum)) {
    const count = Number(actual[schema] ?? 0);
    record(`postgres.${schema} has its tables`, count >= floor, `${count} tables (floor ${floor})`);
  }

  const searchTest = Number(psql('ecom_search_test', 'select count(*) from information_schema.tables where table_schema = \'search\''));
  record('postgres ecom_search_test survived', searchTest >= 2, `${searchTest} tables in schema search`);
}

/** Transactions are the whole reason mongo is a replica set. */
function checkMongoTransactions() {
  const script = `
    const s = db.getMongo().startSession();
    const probe = s.getDatabase('ecom_probe');
    probe.t.drop();
    probe.u.drop();
    s.startTransaction();
    probe.t.insertOne({ probe: true });
    probe.u.insertOne({ probe: true });
    s.abortTransaction();
    const left = probe.t.countDocuments() + probe.u.countDocuments();
    probe.t.drop();
    probe.u.drop();
    print(JSON.stringify({ left, primary: db.adminCommand({ hello: 1 }).isWritablePrimary }));
  `;
  const { left, primary } = JSON.parse(mongosh(script));
  record('mongo is a writable replica-set primary', primary === true, 'hello.isWritablePrimary');
  record('mongo transaction aborts across two collections', left === 0, `${left} documents left behind`);
}

/** Three queues, three DLQs, redrive 5 — read with boto3 inside LocalStack. */
function checkSqs() {
  const program = `
import json, os, boto3
sqs = boto3.client("sqs", endpoint_url="http://localhost:4566",
                   region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
                   aws_access_key_id="test", aws_secret_access_key="test")
queues = [q.split("/")[-1] for q in sqs.list_queues().get("QueueUrls", [])]
out = {}
for name in queues:
    url = sqs.get_queue_url(QueueName=name)["QueueUrl"]
    attrs = sqs.get_queue_attributes(QueueUrl=url, AttributeNames=["All"])["Attributes"]
    redrive = json.loads(attrs.get("RedrivePolicy", "{}"))
    out[name] = {
        "maxReceiveCount": redrive.get("maxReceiveCount"),
        "dlqArn": redrive.get("deadLetterTargetArn", "").split(":")[-1] or None,
        "retention": attrs.get("MessageRetentionPeriod"),
        "waitTime": attrs.get("ReceiveMessageWaitTimeSeconds"),
    }
print(json.dumps(out))
`;
  const out = JSON.parse(
    docker(['exec', '-i', 'ecom-localstack', 'python3', '-'], { input: program }),
  );

  const expected = ['notify-send-email', 'import-process-row', 'media-resize-image'];
  for (const queue of expected) {
    const main = out[queue];
    const dlq = out[`${queue}-dlq`];
    record(`sqs ${queue} exists`, Boolean(main), main ? `dlq=${main.dlqArn}` : 'missing');
    record(`sqs ${queue}-dlq exists`, Boolean(dlq), dlq ? 'present' : 'missing');
    record(
      `sqs ${queue} redrive maxReceiveCount=5`,
      String(main?.maxReceiveCount) === '5' && String(main?.dlqArn) === `${queue}-dlq`,
      `maxReceiveCount=${main?.maxReceiveCount ?? 'none'} -> ${main?.dlqArn ?? 'no dlq'}`,
    );
    record(
      `sqs ${queue} long-polls for 20s`,
      main?.waitTime === '20' && main?.retention === '1209600',
      `waitTime=${main?.waitTime}s retention=${main?.retention}s`,
    );
  }
  // Three queues plus three DLQs and nothing else. A dotted task name such as
  // `reminder.dispatch` could not even be created: SQS rejects dots.
  record('exactly three queues and three DLQs', Object.keys(out).length === 6, `${Object.keys(out).length} queues total`);
}

/** SMTP in on 1025, the message readable on 8025. */
async function checkMailpit() {
  // Mailpit ships a `sendmail` shim that talks to its own SMTP listener over
  // 127.0.0.1:1025 (recipients are positional), so the container exercises the
  // real SMTP path and the host only reads the result back through the HTTP API.
  const message = 'To: dev@ecom.test\nSubject: inf-001 probe\n\nverify-stack.mjs\n';
  try {
    docker(['exec', '-i', 'ecom-mailpit', '/mailpit', 'sendmail', '-f', 'probe@ecom.test', 'dev@ecom.test'], { input: message });
    record('mailpit accepted an SMTP message on 1025', true, 'sendmail -> 127.0.0.1:1025');
  } catch (error) {
    record('mailpit accepted an SMTP message on 1025', false, error.message.split('\n')[0]);
    return;
  }

  const response = await fetch('http://127.0.0.1:8025/api/v1/messages?limit=5');
  const body = await response.json();
  const found = (body.messages ?? []).some((item) => (item.Subject ?? '').includes('inf-001 probe'));
  record('mailpit stores it and serves it on 8025', found, `${body.messages_count ?? 0} messages stored`);
}

async function main() {
  checkContainers();
  checkPostgres();
  checkMongoTransactions();
  checkSqs();
  await checkMailpit();

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) process.exit(1);
}

await main();
