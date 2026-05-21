resource "aws_instance" "web-application" {
  instance_type = "t3.micro"
  ami           = "ami-05d62b9bc5a6ca605"
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  subnet_id     = aws_subnet.public_a.id
  key_name = "aws-ssh"
  associate_public_ip_address = true

  user_data = <<-EOF
              #!/bin/bash
              sudo apt-get update

              sudo apt-get install -y docker.io docker-compose
              sudo systemctl start docker
              sudo systemctl enable docker
              sudo usermod -aG docker ubuntu

              sudo apt install -y awscli

              EOF

  tags = {
    Name = "HDM-Place"
  }
}
