output "queue_urls" {
  description = "Send/target URLs, keyed by the queue name without prefix."
  value       = { for name, queue in aws_sqs_queue.task : name => queue.url }
}

output "queue_arns" {
  description = "ARNs, keyed by the queue name without prefix."
  value       = { for name, queue in aws_sqs_queue.task : name => queue.arn }
}

output "dlq_arns" {
  description = "DLQ ARNs, keyed by the queue name without prefix."
  value       = { for name, queue in aws_sqs_queue.dlq : name => queue.arn }
}

output "task_role_arns" {
  description = "The role each service assumes; empty when IAM is not part of the apply."
  value       = { for name, role in aws_iam_role.task : name => role.arn }
}
