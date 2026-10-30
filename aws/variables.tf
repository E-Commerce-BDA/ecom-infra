variable "project" {
  description = "Prefix for every resource name."
  type        = string
  default     = "e-commerce"
}

variable "region" {
  description = "AWS region for the queues."
  type        = string
  default     = "us-east-1"
}

variable "endpoint" {
  description = "Override the AWS endpoint (LocalStack). Empty means real AWS."
  type        = string
  default     = ""
}

variable "queue_prefix" {
  description = "Extra prefix for queue names. Non-empty values make a throwaway apply that cannot collide with the shared dev queues."
  type        = string
  default     = ""
}

variable "max_receive_count" {
  description = "Deliveries before a message is moved to its DLQ."
  type        = number
  default     = 5

  validation {
    condition     = var.max_receive_count >= 1 && var.max_receive_count <= 1000
    error_message = "SQS accepts a maxReceiveCount between 1 and 1000."
  }
}

variable "visibility_timeout_seconds" {
  description = "How long a received message stays invisible to other consumers."
  type        = number
  default     = 60
}

variable "message_retention_seconds" {
  description = "How long an unconsumed message survives. 14 days is the SQS maximum."
  type        = number
  default     = 1209600
}

variable "receive_wait_time_seconds" {
  description = "Long-poll duration. 20 is the SQS maximum and the cheapest setting."
  type        = number
  default     = 20
}
