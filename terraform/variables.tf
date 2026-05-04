variable "AWS_access_key" {
    description = "AWS Access Key"
    type        = string
    sensitive   = true
}

variable "AWS_secret_key" {
    description = "AWS Secret Key"
    type        = string
    sensitive   = true
}

variable "db_password" {
    description = "Database password for RDS instance"
    type        = string
    sensitive   = true
}