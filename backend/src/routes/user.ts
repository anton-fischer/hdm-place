import type { FastifyInstance } from 'fastify'
import { isOnCooldown, getRemainingCooldown } from '../services/cooldownService.js'
import { userExists} from '../services/userService.js'

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

    // GET /api/users/:id/exists - Check whether a user with given id exists
    app.get<{ Params: { id: string } }>('/api/users/:id/exists', async (req, reply) => {
        const userId = req.params.id
        if (!userId) return reply.status(400).send({ error: 'user id is required' })

        const exists = await userExists(userId)
        return reply.send({ exists })
    })
}

