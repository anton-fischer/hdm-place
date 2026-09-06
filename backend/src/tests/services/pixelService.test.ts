import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { getPixel, getPixels, placePixel, getLeaderboard } from '../../services/pixelService.js'
import { testPrisma, resetDb } from '../testUtils.js'

describe('pixelService', () => {
    beforeEach(async () => {
        await resetDb()
    })

    afterAll(async () => {
        await testPrisma.$disconnect()
    })

    describe('getPixel', () => {
        it('returns null when no pixel exists at the coordinates', async () => {
            expect(await getPixel(1, 1)).toBeNull()
        })

        it('returns the pixel with a numeric placedAt after placement', async () => {
            await placePixel(5, 5, '#ff0000', 'user-a')
            const pixel = await getPixel(5, 5)
            expect(pixel).toMatchObject({ x: 5, y: 5, color: '#ff0000', placedBy: 'user-a' })
            expect(typeof pixel!.placedAt).toBe('number')
        })
    })

    describe('getPixels', () => {
        it('returns only pixels within the inclusive rectangle bounds', async () => {
            await placePixel(0, 0, '#111111', 'user-a')
            await placePixel(5, 5, '#222222', 'user-a')
            await placePixel(10, 10, '#333333', 'user-a')
            await placePixel(11, 11, '#444444', 'user-a')

            const pixels = await getPixels(0, 0, 10, 10)
            const coords = pixels.map((p) => `${p.x},${p.y}`).sort()
            expect(coords).toEqual(['0,0', '10,10', '5,5'])
        })
    })

    describe('placePixel', () => {
        it('creates a user with pixelCount 1 on first placement', async () => {
            await placePixel(1, 2, '#ff0000', 'new-user')
            const user = await testPrisma.user.findUnique({ where: { id: 'new-user' } })
            expect(user?.pixelCount).toBe(1)
        })

        it('increments pixelCount on a second placement by the same user', async () => {
            await placePixel(1, 2, '#ff0000', 'repeat-user')
            await placePixel(3, 4, '#00ff00', 'repeat-user')
            const user = await testPrisma.user.findUnique({ where: { id: 'repeat-user' } })
            expect(user?.pixelCount).toBe(2)
        })

        it('overwrites color/placedBy on repeated placement at the same coordinate without duplicating the row', async () => {
            await placePixel(7, 7, '#111111', 'user-a')
            await placePixel(7, 7, '#222222', 'user-b')

            const pixel = await getPixel(7, 7)
            expect(pixel).toMatchObject({ color: '#222222', placedBy: 'user-b' })

            const allPixels = await testPrisma.pixel.findMany({ where: { x: 7, y: 7 } })
            expect(allPixels).toHaveLength(1)
        })
    })

    describe('getLeaderboard', () => {
        it('returns the top 10 users ordered by pixelCount descending', async () => {
            for (let i = 0; i < 12; i++) {
                await testPrisma.user.create({ data: { id: `user-${i}`, pixelCount: i } })
            }

            const leaderboard = await getLeaderboard()
            expect(leaderboard).toHaveLength(10)
            expect(leaderboard[0]).toEqual({ id: 'user-11', pixelCount: 11 })
            expect(leaderboard[9]).toEqual({ id: 'user-2', pixelCount: 2 })
        })
    })
})
