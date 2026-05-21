output "server_ip" {
  description = "The IP address of the server"
  value = aws_instance.web-application.public_ip
}

output "db_endpoint" {
  description = "The Endpoint address of the database"
  value     = aws_db_instance.hdm-place.endpoint
}

output "ecr_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "Nutze diese URL für deinen 'docker push'"
}