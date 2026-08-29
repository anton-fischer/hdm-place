import { buildApp } from './app.js'

const app = await buildApp()

const PORT = 3001
await app.listen({ port: PORT, host: '0.0.0.0' })
console.log(`Server running on http://localhost:${PORT}`)