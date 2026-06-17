# HDM-Place

## Project Setup
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
Install aws cli and configure it with your credentials.
Configure with Access Key ID, Secret Access Key and default region (eu-north-1).

````
$ curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
$ unzip awscliv2.zip
$ sudo ./aws/install
````

There might be problems with destroying if the ecr repository is not empty, so you might want to delete the repository before running `terraform destroy` again:

````
$ aws ecr delete-repository --repository-name hdm-place-backend --force
````

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

#### Deployment steps:

**Manual**:

1. In backend directory create docker image: 

    ````
    $ docker build -t hdm-place-backend .
    ````

2. Connect to ECR:

    ````
    $ aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 512830091337.dkr.ecr.eu-north-1.amazonaws.com
    ````

3. Tag the image:

    ````
    $ docker tag hdm-place-backend:latest 512830091337.dkr.ecr.eu-north-1.amazonaws.com/hdm-place-backend:latest
    ````

4. Push the image to ECR:

    ````
    $ docker push 512830091337.dkr.ecr.eu-north-1.amazonaws.com/hdm-place-backend:latest
    ````

5. Connect to EC2 instance using SSH (change the command according to your instance's public DNS and your SSH key path):

    e.g.
    ````
    ssh -i ~countered/.ssh/aws-ssh.pem ubuntu@ec2-16-170-229-168.eu-north-1.compute.amazonaws.com
    
    ````
   
6. Configure aws cli on EC2 instance with the same credentials as before.

7. Pull the latest image from ECR:

    ````
    $ aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 512830091337.dkr.ecr.eu-north-1.amazonaws.com
    $ docker pull 512830091337.dkr.ecr.eu-north-1.amazonaws.com/hdm-place-backend:latest
    ````

8. Run the Docker container on EC2 instance with the appropriate environment variable for the database connection & user & pw:

    ````
    $ docker run -d -p 3000:3001 --name hdm-backend --restart always -e DATABASE_URL="postgresql://{user}:{pw}@hdm-place-db.cna2oaqigmky.eu-north-1.rds.amazonaws.com:5432/hdm-place?schema=public" 512830091337.dkr.ecr.eu-north-1.amazonaws.com/hdm-place-backend:latest
    ````
   
9. Sync the frontend build files to S3 bucket (from the frontend directory):

    ````
    $ npm run build
    $ aws s3 sync out/ s3://hdm-place-frontend --delete
    ````
   
10. Connect to Cloudfront
   
The url should look something like this: `https://dp27jh7sg1yn5.cloudfront.net/`

## Documentation 

Generation of infrastructure diagramm via "Inframap" 

````
inframap generate . | dot -Tpng -Gbgcolor=transparent -Gfontname="sans-serif" -Nfontname="sans-serif" -Nfontcolor=white -Ncolor=white -Efontname="sans-serif" -Ecolor=white -Efontcolor=white > infrastructure_diagram.png
````