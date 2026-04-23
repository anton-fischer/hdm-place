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
  region = "us-east-1"
  access_key = AWS_ACCESS_KEY_ID
  secret_key = AWS_SECRET_ACCESS_KEY
}

# Create a VPC
resource "aws_vpc" "example" {
  cidr_block = "10.0.0.0/16"
}

# SSH Keys
resource "aws_key_pair" "adrian" {
  key_name   = "ae088@hdm-stuttgart.de"
  public_key = file("../.ssh/adrian.pub")
}

resource "aws_key_pair" "anton" {
  key_name   = "af127@hdm-stuttgart.de"
  public_key = file("../.ssh/anton.pub")
}

resource "aws_key_pair" "erik" {
  key_name   = "eb102@hdm-stuttgart.de"
  public_key = file("../.ssh/erik.pub")
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