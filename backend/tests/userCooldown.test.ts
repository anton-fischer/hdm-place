import { describe, it, expect } from 'vitest'
import { buildApp } from '../src/app.js'

describe('user cooldown route', () => {
    it('returns cooldown info for given id', async () => {
        const app = await buildApp()
        const res = await app.inject({ method: 'GET', url: '/api/users/test-user/cooldown' })
        expect(res.statusCode).toBe(200)
        const body = JSON.parse(res.payload)
        expect(body).toHaveProperty('userId', 'test-user')
        expect(body).toHaveProperty('isOnCooldown')
        expect(body).toHaveProperty('remainingSeconds')
        expect(typeof body.remainingSeconds).toBe('number')
        await app.close()
    })
})
