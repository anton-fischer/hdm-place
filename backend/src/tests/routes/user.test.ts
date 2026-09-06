import { describe, it, expect } from 'vitest'
import { buildApp } from '../../app.js'
import { testPrisma, resetDb } from '../testUtils.js'
import { beforeEach, afterAll } from 'vitest'

describe('user routes', () => {
    beforeEach(async () => {
        await resetDb()
    })

    afterAll(async () => {
        await testPrisma.$disconnect()
    })

    describe('GET /api/users/:id/cooldown', () => {
        it('returns cooldown info for a user with no cooldown set', async () => {
            const app = await buildApp()
            const res = await app.inject({ method: 'GET', url: '/api/users/test-user/cooldown' })
            expect(res.statusCode).toBe(200)
            const body = JSON.parse(res.payload)
            expect(body).toEqual({ userId: 'test-user', isOnCooldown: false, remainingSeconds: 0 })
            await app.close()
        })
    })

    describe('GET /api/users/:id/exists', () => {
        it('returns false for a user that has never placed a pixel', async () => {
            const app = await buildApp()
            const res = await app.inject({ method: 'GET', url: '/api/users/unknown-user/exists' })
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(res.payload)).toEqual({ exists: false })
            await app.close()
        })

        it('returns true after the user has placed a pixel', async () => {
            await testPrisma.user.create({ data: { id: 'existing-user', pixelCount: 1 } })
            const app = await buildApp()
            const res = await app.inject({ method: 'GET', url: '/api/users/existing-user/exists' })
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(res.payload)).toEqual({ exists: true })
            await app.close()
        })
    })
})
