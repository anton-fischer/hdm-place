import type { FastifyInstance } from 'fastify'
import { isOnCooldown, getRemainingCooldown } from '../services/cooldownService.js'

export async function userRoutes(app: FastifyInstance) {

    // GET /api/users/:id/cooldown - Cooldown info for given user id
    app.get<{ Params: { id: string } }>('/api/users/:id/cooldown', async (req, reply) => {
        const userId = req.params.id

        const onCooldown = isOnCooldown(userId)
        const remaining = getRemainingCooldown(userId)

        return reply.send({
            userId,
            isOnCooldown: onCooldown,
            remainingSeconds: remaining
        })
    })
}