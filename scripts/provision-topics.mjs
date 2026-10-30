#!/usr/bin/env node
/**
 * Creates the Kafka topics declared in `@ecom/contracts` EVENT_TOPICS.
 *
 *   node scripts/provision-topics.mjs          # create what is missing, fix drift
 *   node scripts/provision-topics.mjs --dry-run # print the plan, touch nothing
 *
 * The registry is the only source of truth: partitions, retention and the DLQ
 * name all come from there, so a topic cannot exist with values that disagree
 * with the contracts the producers and consumers compile against.
 *
 * Partition counts are only ever raised. Kafka cannot shrink a topic, so a
 * registry value below the live value is reported as a conflict instead of
 * being silently "fixed".
 */
import { EVENT_TOPICS, dlqTopicName } from '@ecom/contracts';
import { describeTopic, kafka, listTopics, retentionToMs } from './kafka.mjs';

const DRY_RUN = process.argv.includes('--dry-run');
const REPLICATION_FACTOR = process.env.KAFKA_REPLICATION_FACTOR ?? '1';

/** Per-topic settings every event topic shares; retention is per topic. */
const baseConfig = (retentionMs) => [
  // Each --config flag and its value are separate argv entries: kafka-topics.sh
  // parses them individually, so "--config retention.ms=x" in one string is
  // rejected as an unknown option.
  '--config', `retention.ms=${retentionMs}`,
  '--config', 'cleanup.policy=delete',
  // One broker locally: min ISR above 1 would make every write fail.
  '--config', 'min.insync.replicas=1',
];

const planned = [];
const conflicts = [];

function plan(topic, { partitions, retention }) {
  const retentionMs = retentionToMs(retention);
  const live = describeTopic(topic);

  if (!live) {
    planned.push({ topic, action: 'create', partitions, retentionMs });
    return;
  }

  if (live.partitions === null) {
    conflicts.push(`${topic}: cannot read PartitionCount`);
    return;
  }

  if (live.partitions < partitions) {
    planned.push({ topic, action: 'add-partitions', from: live.partitions, partitions, retentionMs });
  } else if (live.partitions > partitions) {
    conflicts.push(
      `${topic}: has ${live.partitions} partitions, registry wants ${partitions}. Kafka cannot shrink; delete the topic or raise the registry.`,
    );
  }

  if (live.configs['retention.ms'] !== retentionMs) {
    planned.push({ topic, action: 'set-retention', from: live.configs['retention.ms'], retentionMs });
  }
}

for (const [topic, config] of Object.entries(EVENT_TOPICS)) {
  plan(topic, config);
  // The DLQ mirrors its source: same key, same partitions, same retention.
  plan(dlqTopicName(topic), config);
}

if (planned.length === 0) {
  console.log(`nothing to do: ${Object.keys(EVENT_TOPICS).length * 2} topics already match the registry`);
} else {
  for (const step of planned) {
    const detail =
      step.action === 'create'
        ? `${step.partitions}p retention=${step.retentionMs}ms`
        : step.action === 'add-partitions'
          ? `${step.from}p -> ${step.partitions}p`
          : `retention ${step.from ?? 'default'} -> ${step.retentionMs}ms`;
    console.log(`${DRY_RUN ? 'would ' : ''}${step.action.padEnd(14)} ${step.topic}  (${detail})`);
  }
}

if (!DRY_RUN) {
  for (const step of planned) {
    if (step.action === 'create') {
      kafka('kafka-topics.sh', [
        '--create',
        '--topic', step.topic,
        '--partitions', String(step.partitions),
        '--replication-factor', REPLICATION_FACTOR,
        ...baseConfig(step.retentionMs),
      ]);
    }

    if (step.action === 'add-partitions') {
      kafka('kafka-topics.sh', ['--alter', '--topic', step.topic, '--partitions', String(step.partitions)]);
    }

    if (step.action === 'set-retention') {
      kafka('kafka-configs.sh', [
        '--alter',
        '--entity-type', 'topics',
        '--entity-name', step.topic,
        '--add-config', `retention.ms=${step.retentionMs}`,
      ]);
    }
  }
}

// Anything on the broker that the registry does not know about is drift: with
// auto-create off it can only come from a manual command or an old volume.
const registry = new Set(Object.keys(EVENT_TOPICS).flatMap((topic) => [topic, dlqTopicName(topic)]));
const internal = (topic) => topic.startsWith('__') || topic.startsWith('_');
const unknown = listTopics().filter((topic) => !internal(topic) && !registry.has(topic));

if (unknown.length > 0) {
  console.warn(`\nnot in the registry (${unknown.length}): ${unknown.join(', ')}`);
}

if (conflicts.length > 0) {
  console.error('\nconflicts:');
  for (const conflict of conflicts) console.error(`  ${conflict}`);
  process.exit(1);
}

console.log(`\nregistry: ${registry.size} topics (${Object.keys(EVENT_TOPICS).length} events + DLQs)`);
