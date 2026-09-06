import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

// load the test database URL before any service imports a PrismaClient
dotenv.config({ path: fileURLToPath(new URL('./.env.test', import.meta.url)) })
