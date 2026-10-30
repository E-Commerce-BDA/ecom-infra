# The three SQS task queues and their DLQs.
#
# Tasks are SQS-only: they are commands, not facts, so they never go to Kafka.
# The names are hyphenated because SQS allows only alphanumerics, hyphens and
# underscores; the canonical list lives in `@ecom/contracts` TASK_QUEUES and a
# change has to land in both places.
#
#   notify-send-email   notify-svc   one email per event
#   import-process-row  import-svc   one product row per message
#   media-resize-image  cms-svc      one uploaded image per message

locals {
  task_queues = {
    "notify-send-email" = {
      producer = "notify-svc"
      consumer = "notify-svc"
    }
    "import-process-row" = {
      producer = "import-svc"
      consumer = "import-svc"
    }
    "media-resize-image" = {
      producer = "cms-svc"
      consumer = "cms-svc"
    }
  }

  # queue_prefix is empty for the shared stack; it is non-empty only for the
  # throwaway apply that proves this configuration against LocalStack.
  queue_name = { for name in keys(local.task_queues) : name => "${var.queue_prefix}${name}" }
}

resource "aws_sqs_queue" "dlq" {
  for_each = local.task_queues

  name                       = "${local.queue_name[each.key]}-dlq"
  message_retention_seconds  = var.message_retention_seconds
  visibility_timeout_seconds = var.visibility_timeout_seconds
  sqs_managed_sse_enabled    = true

  tags = {
    Project  = var.project
    Purpose  = "dead-letter"
    Consumer = each.value.consumer
  }
}

resource "aws_sqs_queue" "task" {
  for_each = local.task_queues

  name                       = local.queue_name[each.key]
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  receive_wait_time_seconds  = var.receive_wait_time_seconds
  sqs_managed_sse_enabled    = true

  # After max_receive_count failed deliveries the broker moves the message to
  # the DLQ itself; no consumer code decides when to give up.
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[each.key].arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = {
    Project  = var.project
    Producer = each.value.producer
    Consumer = each.value.consumer
  }
}
