import Fastify from 'fastify'
import cors from '@fastify/cors'

const app = Fastify({ logger: true })

app.register(cors, { origin: '*' })

app.get('/health', async () => {
    return { status: 'ok' }
})

const pixels: Record<string, string> = {}

app.get('/pixels', async () => {
    return pixels
})

app.post('/pixels', async (req, reply) => {
    const { x, y, color } = req.body as { x: number; y: number; color: string }
    pixels[`${x},${y}`] = color
    return reply.status(201).send({ x, y, color })
})

const start = async () => {
    await app.listen({ port: 3000, host: '0.0.0.0' })
    console.log('Server läuft auf http://localhost:3000')
}

start()
