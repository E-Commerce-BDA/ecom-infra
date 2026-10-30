#!/bin/bash
# Turns the local mongod into a single-node replica set.
#
# A standalone mongod cannot open a transaction, so cms-005 (cms_outbox) would
# have no way to write the row and the outbox entry atomically. One member is
# enough locally: it provides `startSession()`, `withTransaction()` and the oplog.
#
# The member is registered under the compose service name (`mongo:27017`).
# Host clients reach it with `?directConnection=true`, which tells the driver to
# talk to the node it connected to instead of following the advertised address.
set -euo pipefail

HOST="${MONGO_HOST:-mongo:27017}"
RS_NAME="${MONGO_RS_NAME:-rs0}"

echo "[rs-init] waiting for mongod at ${HOST}"
for _ in $(seq 1 60); do
  if mongosh --quiet --host "${HOST}" --eval 'db.adminCommand({ping:1}).ok' >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "[rs-init] initiating ${RS_NAME}"
mongosh --quiet --host "${HOST}" --eval "
  try {
    rs.status();
    print('[rs-init] replica set ${RS_NAME} already initiated');
  } catch (e) {
    rs.initiate({ _id: '${RS_NAME}', members: [{ _id: 0, host: '${HOST}' }] });
    print('[rs-init] rs.initiate sent');
  }
"

for _ in $(seq 1 60); do
  if [ "$(mongosh --quiet --host "${HOST}" --eval 'db.adminCommand({hello:1}).isWritablePrimary')" = "true" ]; then
    echo "[rs-init] ${RS_NAME} has a writable primary"
    exit 0
  fi
  sleep 1
done

echo "[rs-init] no writable primary after 60s" >&2
exit 1
