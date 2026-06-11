resource "aws_db_subnet_group" "subnet_db" {
  name       = "hdm-place-subnet-db"
  subnet_ids = [aws_subnet.private_subnet_rds.id, aws_subnet.private_subnet_b.id]
}

resource "aws_db_instance" "db" {
  identifier        = "hdm-place-db"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp3"

  db_name  = "hdm_place"
  username = "hdm_place"
  password = var.DB_PASSWORD

  db_subnet_group_name   = aws_db_subnet_group.subnet_db.name
  vpc_security_group_ids = [aws_security_group.sg_rds.id]

  multi_az            = false
  publicly_accessible = false

  skip_final_snapshot = true

  tags = {
    Name = "hdm-place-db"
  }
}