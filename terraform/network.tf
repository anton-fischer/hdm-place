# Virtual private network for all other components
resource "aws_vpc" "vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "hdm-place-vpc"
  }
}

# Gateway for traffic between VPC and internet
resource "aws_internet_gateway" "internet_gateway" {
  vpc_id = aws_vpc.vpc.id

  tags = {
    Name = "hdm-place-internet-gateway"
  }
}

# Public Subnets for EC2 and CloudFront
resource "aws_subnet" "public_subnet_ec2" {
  vpc_id            = aws_vpc.vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "eu-north-1a"
  tags              = { Name = "hdm-place-public-subnet-ec2" }
}

resource "aws_subnet" "public_subnet_cloudfront" {
  vpc_id            = aws_vpc.vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "eu-north-1b"
  tags              = { Name = "hdm-place-public-subnet-cloudfront" }
}

# Private Subnets for RDS
resource "aws_subnet" "private_subnet_rds" {
  vpc_id            = aws_vpc.vpc.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "eu-north-1a"
  tags              = { Name = "hdm-place-private-subnet-rds" }
}

resource "aws_subnet" "private_subnet_b" {
  vpc_id            = aws_vpc.vpc.id
  cidr_block        = "10.0.20.0/24"
  availability_zone = "eu-north-1b"
  tags              = { Name = "hdm-place-private-subnet-b" }
}

# Public Subnet Routing
resource "aws_route_table" "route_table" {
  vpc_id = aws_vpc.vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.internet_gateway.id
  }

  tags = {
    Name = "hdm-place-route-table"
  }
}

resource "aws_route_table_association" "public_rta_ec2" {
  subnet_id      = aws_subnet.public_subnet_ec2.id
  route_table_id = aws_route_table.route_table.id
  tags           = { Name = "hdm-place-public-rta-ec2" }
}

resource "aws_route_table_association" "public_rta_cloudfront" {
  subnet_id      = aws_subnet.public_subnet_cloudfront.id
  route_table_id = aws_route_table.route_table.id
  tags           = { Name = "hdm-place-public-rta-cloudfront" }
}