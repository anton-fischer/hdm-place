resource "aws_instance" "web-application" {
  instance_type = "t3.micro"
  ami           = "ami-0a0823e4ea064404d"
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  subnet_id     = aws_subnet.public_a.id
  key_name = "aws-ssh"
  associate_public_ip_address = true

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
