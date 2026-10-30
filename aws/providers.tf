locals {
  # A custom endpoint means LocalStack: it accepts any credentials and does not
  # answer STS, so validation and account lookup have to be skipped.
  localstack = var.endpoint != ""
}

provider "aws" {
  region = var.region

  # Never a real key here: LocalStack only needs a non-empty string, and real
  # AWS resolves credentials from the environment, profile or instance role.
  access_key                  = local.localstack ? "test" : null
  secret_key                  = local.localstack ? "test" : null
  skip_credentials_validation = local.localstack
  skip_requesting_account_id  = local.localstack
  skip_metadata_api_check     = local.localstack

  endpoints {
    sqs = local.localstack ? var.endpoint : null
    iam = local.localstack ? var.endpoint : null
  }
}
