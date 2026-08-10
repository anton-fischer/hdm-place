# HdM-Place

HdM-Place is a online game inspired by w/place. Players can place pixels on a map which gets updated in real time.

This project was made by Adrian, Anton and Erik as part of the lecture Software Development for Cloud Computing in the SoSe 2026.

## Tech-Stack

### Frontend
- Next.js
- Typescript

### Backend
- Fastify
- Prisma
- Typescript
- PostgreSQL

### AWS Services
- ECS on Fargate + ALB (Backend)
- RDS (Database)
- S3 (Static files e.g. Frontend build)
- CloudFront (CDN for static files)
- VPC (Virtual Private Cloud for secure network architecture)
- ECR (Elastic Container Registry for storing Docker images)

### Deployment
- GitHub Actions
- Terraform
- Docker

## Local setup

Following steps can be followed to run hdm-place locally e.g. for testing or development.

### Setup frontend

1. Navigate into the frontend directory, e.g. via `cd ./frontend`.
2. Run `npm install` to install all required packages.
3. Then run `npm run dev` to start the live server for the web app.

The live server will be hosted [here](http://localhost:3000) per default.

### Setup backend & database

1. Navigate into the backend directory, e.g. via `cd ./backend`.
2. Create a `.env` file based on the template `.env.template`.
3. Fill in all values and source the variables, e.g. via `. .env`.
4. Run `docker-compose up` to start the PostgreSQL container, used as our database.
5. Run `npm install` to install all required packages.
6. Run `npx prisma generate` to generate the Prisma client.
7. Run `npx prisma migrate dev` to run the database migrations.
8. Then run `npm run dev` to start the backend application.

The database will be hosted on Port 5432 per default.

The backend / API will be hosted on Port 3001 per default.

## Deployment

Following steps can be followed to deploy hdm-place. This can be either done manually or automatically using our GitHub actions pipeline.

### Automatic

Pushing to `main` triggers the [pipeline](.github/workflows/deploy.yml) located in `.github/workflows/deploy.yml`.

This will then build and push the backend image to ECR, forces a new ECS deployment, and builds / syncs the frontend to S3 with a CloudFront invalidation.

Note: Make sure all env variables are set as GitHub Secrets. The value for `CLOUDFRONT_DISTRIBUTION_ID` must be updated, whenever a `terraform apply` is run (see new value in output vars).

### Manual

**Run terraform**

1. Make sure docker, terraform and AWS CLI are installed and configured.
2. Navigate into the backend directory, e.g. via `cd ./terraform`.
3. Create a `.env` file based on the template `.env.template`.
4. Fill in all values (any password can be used as database password) and source the variables, e.g. via `. .env`.
5. Then run `terraform init`, `terraform plan` and `terraform apply` to deploy the config (this may take a while).

**Deploy Backend**

1. In backend directory create docker image: 

``
docker build -t hdm-place-backend .
``

2. Connect to ECR:

``
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 512830091337.dkr.ecr.eu-north-1.amazonaws.com
``

3. Tag the image:

``
docker tag hdm-place-backend:latest 512830091337.dkr.ecr.eu-north-1.amazonaws.com/hdm-place-backend:latest
``

4. Push the image to ECR:

``
docker push 512830091337.dkr.ecr.eu-north-1.amazonaws.com/hdm-place-backend:latest
``

5. Force the ECS service to redeploy with the new image:

``
aws ecs update-service --region eu-north-1 --cluster hdm-place --service backend --force-new-deployment
``

**Deploy Frontend**

1. Sync the frontend build files to S3 bucket (from the frontend directory):

``
npm run build
aws s3 sync out/ s3://hdm-place-s3-frontend --delete --region eu-north-1
``

2. Invalidate the CloudFront cache (CloudFront is global, so no `--region` needed here):

(Without the cache invalidation, Cloudfront uses the default TTL of 24h and a user would see the changes only afterward.)

``
aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
``

The distribution id is logged as terraform output variable. Alternatively, it can be acquired via the command:

``
aws cloudfront list-distributions --region eu-north-1 --query "DistributionList.Items[].{Id:Id,Domain:DomainName}" --output table
``

The url should look something like this `https://dp27jh7sg1yn5.cloudfront.net/` and is also logged as terraform output variable.

# Documentation

The blog article about our project is located here (TODO).

A further documentation is located here (TODO).

Generation of infrastructure diagramm via "Inframap" 

````
inframap generate . | dot -Tpng -Gbgcolor=transparent -Gfontname="sans-serif" -Nfontname="sans-serif" -Nfontcolor=white -Ncolor=white -Efontname="sans-serif" -Ecolor=white -Efontcolor=white > infrastructure_diagram.png
````