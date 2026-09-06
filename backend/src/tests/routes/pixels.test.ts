import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { randomUUID } from 'node:crypto'
import { testPrisma, resetDb } from '../testUtils.js'

const { broadcastMock } = vi.hoisted(() => ({ broadcastMock: vi.fn() }))

vi.mock('../../websocket/handler.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../websocket/handler.js')>()
    return { ...actual, broadcast: broadcastMock }
})

const { buildApp } = await import('../../app.js')

describe('pixel routes', () => {
    beforeEach(async () => {
        await resetDb()
        broadcastMock.mockClear()
    })

    afterAll(async () => {
        await testPrisma.$disconnect()
    })

    describe('GET /api/pixel/:x/:y', () => {
        it('returns 404 when the pixel does not exist', async () => {
            const app = await buildApp()
            const res = await app.inject({ method: 'GET', url: '/api/pixel/1/1' })
            expect(res.statusCode).toBe(404)
            await app.close()
        })

        it('returns the pixel after it has been placed', async () => {
            await testPrisma.user.create({ data: { id: 'seed-user', pixelCount: 1 } })
            await testPrisma.pixel.create({ data: { x: 2, y: 3, color: '#ff0000', placedBy: 'seed-user' } })

            const app = await buildApp()
            const res = await app.inject({ method: 'GET', url: '/api/pixel/2/3' })
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(res.payload)).toMatchObject({ x: 2, y: 3, color: '#ff0000' })
            await app.close()
        })
    })

    describe('GET /api/pixels/:x1/:y1/:x2/:y2', () => {
        it('returns pixels within the requested rectangle', async () => {
            await testPrisma.user.create({ data: { id: 'seed-user', pixelCount: 2 } })
            await testPrisma.pixel.create({ data: { x: 1, y: 1, color: '#111111', placedBy: 'seed-user' } })
            await testPrisma.pixel.create({ data: { x: 9, y: 9, color: '#222222', placedBy: 'seed-user' } })

            const app = await buildApp()
            const res = await app.inject({ method: 'GET', url: '/api/pixels/0/0/5/5' })
            expect(res.statusCode).toBe(200)
            const body = JSON.parse(res.payload)
            expect(body).toHaveLength(1)
            expect(body[0]).toMatchObject({ x: 1, y: 1 })
            await app.close()
        })
    })

    describe('POST /api/pixel', () => {
        it('returns 400 when required fields are missing', async () => {
            const app = await buildApp()
            const res = await app.inject({
                method: 'POST',
                url: '/api/pixel',
                payload: { x: 1, y: 1, color: '#ff0000' } // missing userId
            })
            expect(res.statusCode).toBe(400)
            await app.close()
        })

        it('returns 400 for an invalid color format', async () => {
            const app = await buildApp()
            const res = await app.inject({
                method: 'POST',
                url: '/api/pixel',
                payload: { x: 1, y: 1, color: 'red', userId: randomUUID() }
            })
            expect(res.statusCode).toBe(400)
            await app.close()
        })

        it('places a pixel, returns 201 and broadcasts the event', async () => {
            const userId = randomUUID()
            const app = await buildApp()
            const res = await app.inject({
                method: 'POST',
                url: '/api/pixel',
                payload: { x: 4, y: 4, color: '#00ff00', userId }
            })
            expect(res.statusCode).toBe(201)
            expect(JSON.parse(res.payload)).toMatchObject({ x: 4, y: 4, color: '#00ff00', placedBy: userId })
            expect(broadcastMock).toHaveBeenCalledWith({
                type: 'pixel:placed',
                payload: expect.objectContaining({ x: 4, y: 4, color: '#00ff00' })
            })
            await app.close()
        })

        it('returns 429 with retryAfter when the user is on cooldown', async () => {
            const userId = randomUUID()
            const app = await buildApp()
            await app.inject({
                method: 'POST',
                url: '/api/pixel',
                payload: { x: 5, y: 5, color: '#00ff00', userId }
            })

            const res = await app.inject({
                method: 'POST',
                url: '/api/pixel',
                payload: { x: 6, y: 6, color: '#0000ff', userId }
            })
            expect(res.statusCode).toBe(429)
            const body = JSON.parse(res.payload)
            expect(typeof body.retryAfter).toBe('number')
            await app.close()
        })
    })
})
