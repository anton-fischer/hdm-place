resource "aws_cognito_user_pool" "hdm-place" {
  name = "hdm-place-users"
  
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_uppercase = true
    require_numbers   = true
  }

  tags = {
    Name = "hdm-place-cognito"
  }
}

resource "aws_cognito_user_pool_client" "frontend" {
  name         = "hdm-place-frontend"
  user_pool_id = aws_cognito_user_pool.hdm-place.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
  
  callback_urls = ["https://${aws_cloudfront_distribution.hdm-place.domain_name}"]
  logout_urls   = ["https://${aws_cloudfront_distribution.hdm-place.domain_name}"]

  supported_identity_providers = ["COGNITO"]
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.hdm-place.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.frontend.id
}