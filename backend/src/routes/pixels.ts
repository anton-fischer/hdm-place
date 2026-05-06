import type {FastifyInstance} from 'fastify'
import { getPixel, getTile, placePixel } from '../services/pixelService.js'
import { isOnCooldown, getRemainingCooldown, setCooldown } from '../services/cooldownService.js'
import { broadcast } from '../websocket/handler.js'

export async function pixelRoutes(app: FastifyInstance) {

    // GET /api/pixels/:x/:y – query single pixel
    app.get<{ Params: { x: number; y: number } }>('/api/pixels/:x/:y', async (req, reply) => {
        const x = req.params.x
        const y = req.params.y

        const pixel = await getPixel(x, y)
        if (!pixel) {
            return reply.status(404).send({ error: 'Pixel not found' })
        }
        return pixel
    })

    // GET /api/tiles/:x1/:y1/:x2/:y2 – Load canvas area
    app.get<{ Params: { x1: number; y1: number; x2: number; y2: number } }>(
        '/api/tiles/:x1/:y1/:x2/:y2',
        async (req) => {
            const { x1, y1, x2, y2 } = req.params
            return await getTile(x1, y1, x2, y2)
        }
    )

    // POST /api/pixels – Place pixel
    app.post<{ Body: { x: number; y: number; color: string; userId: string } }>(
        '/api/pixels',
        async (req, reply) => {
            const { x, y, color, userId } = req.body

            // Validation
            if (x == null || y == null || !color || !userId) {
                return reply.status(400).send({ error: 'x, y, color und userId are required' })
            }
            if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
                return reply.status(400).send({ error: 'Invalid color format, expected e.g. #FF0000' })
            }

            // Check cooldown
            if (isOnCooldown(userId)) {
                return reply.status(429).send({
                    error: 'Cooldown is active',
                    retryAfter: getRemainingCooldown(userId)
                })
            }

            const pixel = await placePixel(x, y, color, userId)
            setCooldown(userId)

            // Broadcast all WebSocket-Clients the new pixel
            broadcast({ type: 'pixel:placed', payload: pixel })

            return reply.status(201).send(pixel)
        }
    )
}