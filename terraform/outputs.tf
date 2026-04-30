output "server_ip" {
  description = "The IP address of the server"
  value = aws_instance.web-application.public_ip
}