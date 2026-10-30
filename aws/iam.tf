# Per-service IAM: one role and one policy per queue owner.
#
# A service can do exactly three things with its own queue — send, receive,
# delete (and keep a message alive while it works). It cannot read another
# service's queue, and no policy grants `sqs:*` or a wildcard resource. The DLQ
# is readable for inspection but not writable: only the broker's redrive moves
# messages there.

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type = "Service"
      # ECS Fargate task role: the shape the services ship as in production.
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "task_queue" {
  for_each = local.task_queues

  statement {
    sid    = "ConsumeOwnQueue"
    effect = "Allow"

    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:ChangeMessageVisibility",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
    ]

    resources = [aws_sqs_queue.task[each.key].arn]
  }

  statement {
    sid       = "InspectOwnDlq"
    effect    = "Allow"
    actions   = ["sqs:GetQueueAttributes", "sqs:GetQueueUrl", "sqs:ReceiveMessage"]
    resources = [aws_sqs_queue.dlq[each.key].arn]
  }
}

resource "aws_iam_role" "task" {
  for_each = local.task_queues

  name               = "${var.project}-${local.queue_name[each.key]}"
  description        = "Sends and consumes ${local.queue_name[each.key]} only."
  assume_role_policy = data.aws_iam_policy_document.assume_role.json

  tags = {
    Project = var.project
    Service = each.value.consumer
  }
}

resource "aws_iam_policy" "task_queue" {
  for_each = local.task_queues

  name        = "${var.project}-${local.queue_name[each.key]}"
  description = "Least privilege for ${local.queue_name[each.key]} and its DLQ."
  policy      = data.aws_iam_policy_document.task_queue[each.key].json

  tags = {
    Project = var.project
    Service = each.value.consumer
  }
}

resource "aws_iam_role_policy_attachment" "task_queue" {
  for_each = local.task_queues

  role       = aws_iam_role.task[each.key].name
  policy_arn = aws_iam_policy.task_queue[each.key].arn
}
