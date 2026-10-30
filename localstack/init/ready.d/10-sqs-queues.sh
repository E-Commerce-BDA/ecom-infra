#!/bin/bash
# Task queues, created the moment LocalStack's SQS API is ready.
#
# Tasks are SQS-only (notify-send-email, import-process-row,
# media-resize-image). Each queue has a `<queue>-dlq` twin and a redrive policy
# with maxReceiveCount 5, matching the Terraform modules in ../aws and the
# constants in `@ecom/contracts` TASK_QUEUES. `reminder.dispatch` is not created:
# it was dropped in favour of cart.abandoned + notify-send-email.
#
# The names are hyphenated on purpose. SQS allows only alphanumerics, hyphens and
# underscores (a dot is legal only as the trailing `.fifo`), so the dotted task
# names in the tracker were rejected by the API on the first run. Kafka topics
# keep their dots; SQS queues cannot.
#
# Runs with boto3 from the LocalStack image, so no AWS CLI is needed on the host.
set -euo pipefail

python3 <<'PY'
import json
import os
import sys

import boto3
from botocore.exceptions import ClientError

endpoint = os.environ.get("AWS_ENDPOINT_URL", "http://localhost:4566")
region = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
max_receive = int(os.environ.get("SQS_MAX_RECEIVE_COUNT", "5"))

QUEUES = ["notify-send-email", "import-process-row", "media-resize-image"]

sqs = boto3.client(
    "sqs",
    endpoint_url=endpoint,
    region_name=region,
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
)

common = {
    "VisibilityTimeout": "60",
    "MessageRetentionPeriod": "1209600",  # 14 days, the SQS maximum
    "ReceiveMessageWaitTimeSeconds": "20",  # long poll, never short poll
}


def ensure(queue, attributes):
    """create_queue is idempotent: a second run re-applies the attributes."""
    try:
        sqs.create_queue(QueueName=queue, Attributes=attributes)
    except ClientError as exc:
        print(f"[sqs-init] {queue}: {exc}", file=sys.stderr)
        raise SystemExit(1)
    print(f"[sqs-init] ensured {queue}")


for queue in QUEUES:
    dlq = f"{queue}-dlq"
    ensure(dlq, common)
    dlq_url = sqs.get_queue_url(QueueName=dlq)["QueueUrl"]
    dlq_arn = sqs.get_queue_attributes(
        QueueUrl=dlq_url, AttributeNames=["QueueArn"]
    )["Attributes"]["QueueArn"]

    attributes = dict(common)
    attributes["RedrivePolicy"] = json.dumps(
        {"deadLetterTargetArn": dlq_arn, "maxReceiveCount": max_receive}
    )
    ensure(queue, attributes)

print("[sqs-init] ready:", ", ".join(f"{q}(+dlq)" for q in QUEUES))
PY
