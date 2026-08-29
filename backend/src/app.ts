import Fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import fastifyCors from '@fastify/cors'

import { pixelRoutes } from './routes/pixels.js'
import { leaderboardRoutes } from './routes/leaderboard.js'
import { userRoutes } from './routes/user.js'
import { websocketHandler } from './websocket/handler.js'

export async function buildApp() {
    const app = Fastify({ logger: false })

    await app.register(fastifyCors, { origin: '*' })
    await app.register(fastifyWebsocket)

    await app.register(pixelRoutes)
    await app.register(leaderboardRoutes)
    await app.register(userRoutes)
    await app.register(websocketHandler)

    return app
}
