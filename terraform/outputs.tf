output "server_ip" {
  description = "The public IP address of the ec2"
  value       = aws_instance.web_application.public_ip
}

output "db_endpoint" {
  description = "The Endpoint address of the database"
  value       = aws_db_instance.db.endpoint
}

output "ecr_url" {
  description = "The repository url of the backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "cloudfront_url" {
  description = "The domain name of the cloudfront distribution"
  value       = aws_cloudfront_distribution.hdm_place.domain_name
}