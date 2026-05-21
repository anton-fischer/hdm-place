resource "aws_db_subnet_group" "hdm-place" {
  name       = "hdm-place-db-subnet"
  subnet_ids = [aws_subnet.public_a.id, aws_subnet.public_b.id]
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