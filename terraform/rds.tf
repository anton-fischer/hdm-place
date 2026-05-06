resource "aws_db_subnet_group" "hdm-place" {
  name       = "hdm-place-db-subnet"
  subnet_ids = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

resource "aws_security_group" "rds" {
  name = "hdm-place-rds-sg"
  vpc_id = aws_vpc.hdm-place.id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "hdm-place" {
  identifier        = "hdm-place-db"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp3"

  db_name  = "hdm_place"
  username = "hdm_place"
  password = var.DB_PASSWORD

  db_subnet_group_name   = aws_db_subnet_group.hdm-place.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az            = false
  publicly_accessible = false

  skip_final_snapshot = true

  tags = {
    Name = "hdm-place-db"
  }
}

output "db_endpoint" {
  value     = aws_db_instance.hdm-place.endpoint
  sensitive = true
}