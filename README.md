# HDM-Place

## Setup Project
### Frontend
Run `npm install` to install all required packages.
Then run `npm run dev` to start the web app.

You can access the site [here](http://localhost:3000).

### Backend
Run `docker-compose up` to start the PostgreSQL container

Run `npm install` to install all required packages.

Create `.env` file (currently exacly like .env.template)

Run `npx prisma generate`to generate the Prisma client.
Run `npx prisma migrate dev` to run the database migrations.

Then run `npm run dev` to start the backend application.

### Terraform
- Install aws cli and configure it with your credentials.

````
$ curl -o awscliv2.sig https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip.sig
$ unzip awscliv2.zip
$ sudo ./aws/install
````

Configure with Access Key ID, Secret Access Key and default region (eu-north-1).

## Tech-Stack

### Frontend
- Next.js
- React 
- Typescript

### Backend
- Node.js
- Typescript
- PostgreSQL

### AWS Services
- EC2 (Backend)
- RDS (Database)
- S3 (Static files e.g. Frontend build)
- CloudFront (CDN for static files)
- VPC (Virtual Private Cloud for secure network architecture)
- ECR (Elastic Container Registry for storing Docker images)

### Deployment 
- GitHub Actions
- Terraform
- Docker

Steps:

Manual deployment:

1. In backend directory create docker image: 

`$ docker build -t hdm-place-backend .`

2. 