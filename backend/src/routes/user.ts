import type { FastifyInstance } from 'fastify'
import { isOnCooldown, getRemainingCooldown } from '../services/cooldownService.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

        const user = await prisma.user.findUnique({ where: { id: userId } })
        return reply.send({ exists: !!user })
    })

    // POST /api/users - Create a new user if it does not already exist
    app.post<{ Body: { id: string } }>('/api/users', async (req, reply) => {
        const { id } = req.body
        if (!id || typeof id !== 'string' || !id.trim()) {
            return reply.status(400).send({ error: 'id is required' })
        }

        const existing = await prisma.user.findUnique({ where: { id } })
        if (existing) {
            return reply.status(409).send({ error: 'User already exists' })
        }

        const user = await prisma.user.create({ data: { id, pixelCount: 0 } })
        return reply.status(201).send(user)
    })
}
