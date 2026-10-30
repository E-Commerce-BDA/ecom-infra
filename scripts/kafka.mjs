/**
 * Thin wrapper over the Kafka CLI inside the broker container.
 *
 * The provisioning scripts never open a socket themselves: they drive
 * `kafka-topics.sh` / `kafka-console-*.sh` through `docker exec`, so the host
 * needs no Kafka client and no dependency beyond `@ecom/contracts`.
 */
import { execFileSync, spawnSync } from 'node:child_process';

const CONTAINER = process.env.KAFKA_CONTAINER ?? 'ecom-kafka';
const BROKER = process.env.KAFKA_BOOTSTRAP ?? 'localhost:9092';
const BIN = '/opt/kafka/bin';

export function kafka(tool, args, { input, allowFailure = false } = {}) {
  try {
    return execFileSync(
      'docker',
      ['exec', '-i', CONTAINER, `${BIN}/${tool}`, '--bootstrap-server', BROKER, ...args],
      { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] },
    ).trim();
  } catch (error) {
    if (allowFailure) return null;
    const stderr = error.stderr?.toString().trim();
    throw new Error(`${tool} ${args.join(' ')} failed: ${stderr || error.message}`);
  }
}

/**
 * Same call, but returns the exit code and both streams.
 *
 * The console tools log a failure (UNKNOWN_TOPIC_OR_PARTITION) and still exit 0,
 * so an exit-code-only check would call a rejected produce a success.
 */
export function kafkaCapture(tool, args, { input } = {}) {
  const result = spawnSync(
    'docker',
    ['exec', '-i', CONTAINER, `${BIN}/${tool}`, '--bootstrap-server', BROKER, ...args],
    { encoding: 'utf8', input, timeout: 60_000 },
  );
  return { code: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

export function listTopics() {
  const out = kafka('kafka-topics.sh', ['--list'], { allowFailure: true });
  return out ? out.split('\n').map((line) => line.trim()).filter(Boolean) : [];
}

/**
 * `--describe` prints one line per partition, and the first line carries the
 * aggregate: "Topic: x TopicId: ... PartitionCount: 3 ReplicationFactor: 1
 * Configs: retention.ms=604800000,...".
 */
export function describeTopic(topic) {
  const out = kafka('kafka-topics.sh', ['--describe', '--topic', topic], { allowFailure: true });
  if (!out || out.includes('does not exist')) return null;

  const partitions = out.match(/PartitionCount:\s*(\d+)/);
  const configs = out.match(/Configs:\s*(.*)$/m);

  return {
    partitions: partitions ? Number(partitions[1]) : null,
    configs: configs
      ? Object.fromEntries(
          configs[1]
            .split(',')
            .map((pair) => pair.split('='))
            .filter(([key]) => key && key.trim()),
        )
      : {},
  };
}

/** `7d` / `30d` / `3d` / `12h` → milliseconds, the unit Kafka wants. */
export function retentionToMs(retention) {
  const match = /^(\d+)([dhms])$/.exec(retention);
  if (!match) throw new Error(`unsupported retention '${retention}' (expected e.g. 7d)`);

  const value = Number(match[1]);
  const unit = { d: 86_400_000, h: 3_600_000, m: 60_000, s: 1_000 }[match[2]];
  return String(value * unit);
}
