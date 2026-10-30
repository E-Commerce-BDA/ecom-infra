# Terraform and provider pinning for the task-queue stack.
#
# The same configuration targets two places:
#   * AWS       — default endpoint, credentials from the environment/profile.
#   * LocalStack — `-var endpoint=http://host.docker.internal:4566`, so the queue
#                  and policy definitions are executed, not just validated.
terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }

  # Local state only. Remote state belongs with the rest of the platform state in
  # an S3 + DynamoDB backend once there is an account to put it in.
  backend "local" {}
}
