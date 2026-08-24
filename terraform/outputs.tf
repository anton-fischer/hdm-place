output "alb_dns_name" {
  description = "The DNS name of the ALB in front of the backend"
  value       = aws_lb.hdm_place.dns_name
}

output "db_endpoint" {
  description = "The Endpoint address of the database"
  value       = aws_db_instance.db.endpoint
}

output "ecr_url" {
  description = "The repository url of the backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "cloudfront_url" {
  description = "The domain name of the cloudfront distribution"
  value       = aws_cloudfront_distribution.hdm_place.domain_name
}

output "cloudfront_distribution_id" {
  description = "The ID of the cloudfront distribution, needed for cache invalidations"
  value       = aws_cloudfront_distribution.hdm_place.id
}