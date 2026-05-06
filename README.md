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

## Tech-Stack

### Frontend
- React 
- Typescript

### Backend
- Node.js 
- Typescript
- Nginx (Webserver)

### Data 
- PostgreSQL
- Redis (WebSockets and Rate Limiting)

### Infrastructure
- Oracle Cloud Infrastructure (OCI)
- Docker
- Kubernetes
- Ingress Controller (Load Balancer)

### Deployment 
- Github Actions
- Terraform