# Stores frontend
resource "aws_s3_bucket" "s3_frontend" {
  bucket        = "hdm-place-s3-frontend"
  force_destroy = true
}

# Prevent public accesses on bucket
resource "aws_s3_bucket_public_access_block" "s3_frontend" {
  bucket = aws_s3_bucket.s3_frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy only allows access to Cloudfront
resource "aws_s3_bucket_policy" "s3_frontend" {
  bucket = aws_s3_bucket.s3_frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontAccess"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.s3_frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.hdm_place.arn
          }
        }
      }
    ]
  })
}
