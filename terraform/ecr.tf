resource "aws_ecr_repository" "backend" {
  name                 = "hdm-place-backend"
  image_tag_mutability = "MUTABLE"
  force_delete = true
}
