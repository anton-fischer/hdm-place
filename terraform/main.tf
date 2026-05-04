terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "eu-north-1"
  access_key = var.AWS_access_key
  secret_key = var.AWS_secret_key
}

# Billing alert to avoid unexpected cost
resource "aws_budgets_budget" "alert" {
  name         = "zero-spend-alert"
  budget_type  = "COST"
  limit_amount = "5"
  limit_unit   = "EUR"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["ae088@hdm-stuttgart.de", "af127@hdm-stuttgart.de", "eb102@hdm-stuttgart.de"]
  }
}