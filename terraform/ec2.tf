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



# Security Group
resource "aws_security_group" "app_sg" {
  name = "app_sg"
  vpc_id = aws_vpc.hdm-place.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["141.62.20.199/32"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["141.62.20.199/32"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["141.62.20.199/32"]
  }

  ingress {
    from_port         = 3000
    to_port           = 3000
    protocol          = "tcp"
    cidr_blocks       = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
