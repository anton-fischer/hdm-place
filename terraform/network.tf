resource "aws_vpc" "hdm-place" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "hdm-place-vpc"
  }
}

resource "aws_internet_gateway" "hdm-place" {
  vpc_id = aws_vpc.hdm-place.id

  tags = {
    Name = "hdm-place-igw"
  }
}

# Public Subnets for EC2 and CloudFront
resource "aws_subnet" "public_a" {
  vpc_id            = aws_vpc.hdm-place.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "eu-north-1a"
  tags              = { Name = "hdm-place-public-a" }
}

resource "aws_subnet" "public_b" {
  vpc_id            = aws_vpc.hdm-place.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "eu-north-1b"
  tags              = { Name = "hdm-place-public-b" }
}

# Private Subnets for RDS
resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.hdm-place.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "eu-north-1a"
  tags              = { Name = "hdm-place-private-a" }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.hdm-place.id
  cidr_block        = "10.0.20.0/24"
  availability_zone = "eu-north-1b"
  tags              = { Name = "hdm-place-private-b" }
}

# Public Subnet Routing
resource "aws_route_table" "hdm-place" {
  vpc_id = aws_vpc.hdm-place.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.hdm-place.id
  }

  tags = {
    Name = "hdm-place-rt"
  }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.hdm-place.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.hdm-place.id
}