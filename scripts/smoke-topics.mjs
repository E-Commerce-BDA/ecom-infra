#!/usr/bin/env node
/**
 * Proves the topics in `@ecom/contracts` EVENT_TOPICS exist as declared, that a
 * key really routes to a partition, and that nothing can create a topic by
 * accident.
 *
 *   node scripts/smoke-topics.mjs
 *
 * The round-trip runs on a throwaway `smoke.probe` topic that is deleted again,
 * so the real topics never collect test traffic. Exit code is non-zero on the
 * first failed group.
 */
import { EVENT_TOPICS, dlqTopicName } from '@ecom/contracts';
import { describeTopic, kafka, kafkaCapture, listTopics, retentionToMs } from './kafka.mjs';

const PROBE = 'smoke.probe';
const PROBE_PARTITIONS = 3;
const PROBE_KEYS = 30;

const results = [];
const record = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

/** Every declared topic (and its DLQ) exists with the declared shape. */
function checkRegistry() {
  for (const [topic, config] of Object.entries(EVENT_TOPICS)) {
    for (const name of [topic, dlqTopicName(topic)]) {
      const live = describeTopic(name);
      if (!live) {
        record(`${name} exists`, false, 'missing');
        continue;
      }

      const retention = retentionToMs(config.retention);
      record(
        `${name} shape`,
        live.partitions === config.partitions && live.configs['retention.ms'] === retention,
        `${live.partitions}p (want ${config.partitions}) retention=${live.configs['retention.ms'] ?? 'default'}`,
      );
    }
  }
}

/** A keyed write lands on one partition, and 30 keys reach all three. */
function checkKeyedPartitioning() {
  kafka('kafka-topics.sh', [
    '--create',
    '--topic', PROBE,
    '--partitions', String(PROBE_PARTITIONS),
    '--replication-factor', '1',
  ]);

  try {
    const lines = Array.from({ length: PROBE_KEYS }, (_, index) => `smoke-${index}:value-${index}`).join('\n');
    kafka('kafka-console-producer.sh', [
      '--topic', PROBE,
      '--property', 'parse.key=true',
      '--property', 'key.separator=:',
    ], { input: `${lines}\n` });

    const consumed = kafka('kafka-console-consumer.sh', [
      '--topic', PROBE,
      '--from-beginning',
      '--max-messages', String(PROBE_KEYS),
      '--timeout-ms', '30000',
      '--property', 'print.partition=true',
      '--property', 'print.key=true',
    ], { allowFailure: true }) ?? '';

    const rows = consumed
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('Partition:'))
      .map((line) => line.split('\t'));

    const partitions = new Set(rows.map(([partition]) => partition));
    record(
      `producing ${PROBE_KEYS} keyed messages succeeds`,
      rows.length === PROBE_KEYS,
      `${rows.length} read back`,
    );
    record(
      `keys spread over all ${PROBE_PARTITIONS} partitions`,
      partitions.size === PROBE_PARTITIONS,
      [...partitions].sort().join(', '),
    );
  } finally {
    kafka('kafka-topics.sh', ['--delete', '--topic', PROBE]);
  }

  // Deletion is asynchronous; a topic still listed here is a failed cleanup.
  const gone = !listTopics().includes(PROBE);
  record(`${PROBE} removed again`, gone, gone ? 'deleted' : 'still listed');
}

/** Auto-create must be off: writing to an undeclared topic has to fail. */
function checkAutoCreateOff() {
  const ghost = 'ecom.autocreate.probe';
  const { output } = kafkaCapture('kafka-console-producer.sh', [
    '--topic', ghost,
    // Without a ceiling the producer retries metadata forever; with it, the
    // attempt fails the way an undeclared topic should.
    '--producer-property', 'max.block.ms=4000',
    '--producer-property', 'delivery.timeout.ms=4000',
  ], { input: 'this topic does not exist\n' });

  // The producer logs the rejection and still exits 0, so the log is the signal.
  record(
    'producing to an undeclared topic is rejected',
    output.includes('UNKNOWN_TOPIC_OR_PARTITION') || output.includes('not present in metadata'),
    output.includes('UNKNOWN_TOPIC_OR_PARTITION') ? 'UNKNOWN_TOPIC_OR_PARTITION' : 'no rejection logged',
  );
  record(`${ghost} was not auto-created`, !listTopics().includes(ghost), 'topic list unchanged');
}

/** No stray topics: with auto-create off, the registry is the whole list. */
function checkNoStrays() {
  const registry = new Set(Object.keys(EVENT_TOPICS).flatMap((topic) => [topic, dlqTopicName(topic)]));
  const strays = listTopics().filter(
    (topic) => !topic.startsWith('__') && !registry.has(topic),
  );
  record('no topics outside the registry', strays.length === 0, strays.length ? strays.join(', ') : `${registry.size} declared`);
}

checkRegistry();
checkKeyedPartitioning();
checkAutoCreateOff();
checkNoStrays();

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length > 0) process.exit(1);
