resource "aws_instance" "web_application" {
  instance_type               = "t3.micro"
  ami                         = "ami-05d62b9bc5a6ca605"
  vpc_security_group_ids      = [aws_security_group.sg_ec2.id]
  subnet_id                   = aws_subnet.public_subnet_ec2.id
  key_name                    = "aws-ssh"
  associate_public_ip_address = true

  user_data = file("./cloud-init/ec2-init.yaml")

  tags = {
    Name = "hdm-place-web-application"
  }
}
