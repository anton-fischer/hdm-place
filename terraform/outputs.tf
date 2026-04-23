output "server_ip" {
  description = "The IP address of the server"
  value = aws_instance.webserver.public_ip
}

output "db_endpoint" {
  description = "The IP address of the database"
  value     = aws_db_instance.postgres.address
  sensitive = true
}

output "ssh_command" {
  description = "The ssh command"
  value = "ssh admin@${aws_instance.webserver.public_ip}"
}