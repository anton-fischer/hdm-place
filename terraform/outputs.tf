output "server_ip" {
  description = "The IP address of the server"
  value = aws_instance.web-application.public_ip
}

output "db_endpoint" {
  value     = aws_db_instance.hdm-place.endpoint
  sensitive = true
}

output "ecr_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "Nutze diese URL für deinen 'docker push'"
}