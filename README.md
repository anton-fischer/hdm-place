# HdM-Place

HdM-Place is a online game inspired by w/place. Players can place pixels on a map which gets updated in real time.

This project was made by Adrian, Anton and Erik as part of the lecture Software Development for Cloud Computing in the SoSe 2026.

See our blog article for more information on this project: [HdM-Place: Building a r/place clone for our university](https://blog.mi.hdm-stuttgart.de/index.php/2026/09/12/hdm-place-building-a-r-place-clone-for-our-university/)

## Features

- Pixel placements on an interactive world map
- Color selection between different presets or custom color codes
- Cooldown between pixel placements for each user
- Leaderboard showing the players with the most pixels placed
- Infrastructure as code (Terraform) and automated CI/CD deployment to AWS (GitHub actions)

## Tech-Stack

### Frontend
- [Next.js](https://nextjs.org/) + TypeScript
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) for the interactive map
- [react-hot-toast](https://react-hot-toast.com/) for notifications
- [Font Awesome](https://fontawesome.com/) for icons
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) for testing

### Backend
- [Fastify](https://fastify.io/) + TypeScript
- [Prisma](https://www.prisma.io/) for database model and ORM
- [PostgreSQL](https://www.postgresql.org/) for the database
- [ws](https://github.com/websockets/ws) for WebSocket broadcasting
- [Vitest](https://vitest.dev/) for testing

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

The backend / our API will be hostet on Port 3001 and the database on Port 5432 per default.

## Testing

### Backend

The backend tests use a real PostgreSQL database `pixel_db_test`, which gets created automatically when running the tests in the same Docker container as the dev database.

1. Navigate into the backend directory, e.g. via `cd ./backend`.
2. Run `npm install` to install all required packages.
3. Make sure the database container is running, e.g. via `docker-compose up -d db`.
4. Create a `.env.test` file based on the template `.env.template`, pointing `DATABASE_URL` at the `pixel_db_test` database instead of the dev database.
5. Run `npm test` to first apply migrations to the test database, and then execute the backend tests.

### Frontend

The frontend tests do not require a database or a running backend.

1. Navigate into the frontend directory, e.g. via `cd ./frontend`.
2. Run `npm install` to install all required packages.
3. Run `npm test` to execute the frontend tests.

## Deployment

Following steps can be followed to deploy hdm-place. This can be either done manually or automatically using our GitHub actions pipeline.

### Automatic

The [pipeline](.github/workflows/deploy.yml) located in `.github/workflows/deploy.yml` runs the backend and frontend test suites on every push to `main`.

Deployment only happens when a tag matching `v*` (e.g. `v1.2.0`) is pushed. After the tests pass, it builds and pushes the backend image to ECR, forces a new ECS deployment, and builds / syncs the frontend to S3 with a CloudFront invalidation.

All env variables are need to be set as GitHub Secrets. Following values **must be updated** after running `terraform apply`:

- `CLOUDFRONT_DISTRIBUTION_ID`: value for terraform output variable `cloudfront_distribution_id`
- `NEXT_PUBLIC_BACKEND_API_URL`: `https://` + value for terraform output variable `cloudfront_url`

### Manual

**Run terraform**

1. Make sure docker, terraform and AWS CLI are installed and configured.
2. Navigate into the backend directory, e.g. via `cd ./terraform`.
3. Create a `.env` file based on the template `.env.template`.
4. Fill in all values (any password can be used as database password) and source the variables, e.g. via `. .env`.
5. Then run `terraform init`, `terraform plan` and `terraform apply` to deploy the config (this may take a while).

**Deploy Backend**

1. In backend directory create docker image: 
`docker build -t hdm-place-backend .`

2. Connect to ECR:
`aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 512830091337.dkr.ecr.eu-north-1.amazonaws.com`

3. Tag the image:
`docker tag hdm-place-backend:latest 512830091337.dkr.ecr.eu-north-1.amazonaws.com/hdm-place-backend:latest`

4. Push the image to ECR:
`docker push 512830091337.dkr.ecr.eu-north-1.amazonaws.com/hdm-place-backend:latest`

5. Force the ECS service to redeploy with the new image:
`aws ecs update-service --region eu-north-1 --cluster hdm-place --service backend --force-new-deployment`

**Deploy Frontend**

1. Sync the frontend build files to S3 bucket (from the frontend directory):
`npm run build
aws s3 sync out/ s3://hdm-place-s3-frontend --delete --region eu-north-1`

2. Invalidate the CloudFront cache (Cloudfront uses the default TTL of 24h and a user would see the changes only afterwards, use terraform output variable `cloudfront_distribution_id` as value for `--distribution-id`):
`aws cloudfront create-invalidation --distribution-id <cloudfront_distribution_id> --paths "/*"`

The url should look something like this `https://dp27jh7sg1yn5.cloudfront.net/` and is also logged as terraform output variable.

## License

This project is licensed under the [MIT License](LICENSE).