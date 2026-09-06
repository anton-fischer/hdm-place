import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { buildApp } from '../../app.js'
import { testPrisma, resetDb } from '../testUtils.js'

describe('GET /api/leaderboard', () => {
    beforeEach(async () => {
        await resetDb()
    })

    afterAll(async () => {
        await testPrisma.$disconnect()
    })

    it('returns users ordered by pixelCount descending, capped at 10', async () => {
        for (let i = 0; i < 12; i++) {
            await testPrisma.user.create({ data: { id: `user-${i}`, pixelCount: i } })
        }

        const app = await buildApp()
        const res = await app.inject({ method: 'GET', url: '/api/leaderboard' })
        expect(res.statusCode).toBe(200)

        const body = JSON.parse(res.payload)
        expect(body).toHaveLength(10)
        expect(body[0]).toEqual({ id: 'user-11', pixelCount: 11 })
        expect(body[9]).toEqual({ id: 'user-2', pixelCount: 2 })
        await app.close()
    })

    it('returns an empty array when there are no users', async () => {
        const app = await buildApp()
        const res = await app.inject({ method: 'GET', url: '/api/leaderboard' })
        expect(JSON.parse(res.payload)).toEqual([])
        await app.close()
    })
})
