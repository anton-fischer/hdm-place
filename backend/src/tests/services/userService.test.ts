import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { userExists } from '../../services/userService.js'
import { placePixel } from '../../services/pixelService.js'
import { testPrisma, resetDb } from '../testUtils.js'

describe('userService', () => {
    beforeEach(async () => {
        await resetDb()
    })

    afterAll(async () => {
        await testPrisma.$disconnect()
    })

    it('returns false for an empty id without querying the database', async () => {
        expect(await userExists('')).toBe(false)
    })

    it('returns false for an id that has never placed a pixel', async () => {
        expect(await userExists('nonexistent-user')).toBe(false)
    })

    it('returns true after the user has placed a pixel', async () => {
        await placePixel(1, 1, '#ff0000', 'known-user')
        expect(await userExists('known-user')).toBe(true)
    })
})
