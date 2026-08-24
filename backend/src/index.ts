import Fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import fastifyCors from '@fastify/cors'

import { pixelRoutes } from './routes/pixels.js'
import { leaderboardRoutes } from './routes/leaderboard.js'
import { userRoutes } from './routes/user.js'
import { websocketHandler } from './websocket/handler.js'

const app = Fastify({ logger: true })

await app.register(fastifyCors, { origin: '*' })
await app.register(fastifyWebsocket)

await app.register(pixelRoutes)
await app.register(leaderboardRoutes)
await app.register(userRoutes)
await app.register(websocketHandler)

// Used by the ALB target group health check
app.get('/health', async () => ({ status: 'ok' }))

const PORT = 3001
await app.listen({ port: PORT, host: '0.0.0.0' })
console.log(`Server running on http://localhost:${PORT}`)