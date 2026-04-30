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

resource "aws_instance" "web-application" {
  instance_type = "t3.micro"
  ami           = "ami-0a0823e4ea064404d"
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  key_name = "aws_ssh_key"

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y docker.io docker-compose
              systemctl start docker
              systemctl enable docker
              EOF

  tags = {
    Name = "HDM-Place"
  }
}

# Security Group
resource "aws_security_group" "app_sg" {
  name = "app_sg"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["DEINE_IP/32"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
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