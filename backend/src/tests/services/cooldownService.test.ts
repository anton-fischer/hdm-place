import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { isOnCooldown, getRemainingCooldown, setCooldown } from '../../services/cooldownService.js'

describe('cooldownService', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(0)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('reports no cooldown for a user that never placed a pixel', () => {
        expect(isOnCooldown('fresh-user')).toBe(false)
        expect(getRemainingCooldown('fresh-user')).toBe(0)
    })

    it('is on cooldown right after being set', () => {
        setCooldown('user-a')
        expect(isOnCooldown('user-a')).toBe(true)
    })

    it('rounds the remaining time up to the nearest second', () => {
        setCooldown('user-b')
        vi.setSystemTime(29_200) // 800ms left, i.e. 0.8s -> ceil to 1s
        expect(getRemainingCooldown('user-b')).toBe(1)
    })

    it('expires after 30 seconds and cleans up its internal state', () => {
        setCooldown('user-c')
        vi.setSystemTime(30_001)
        expect(isOnCooldown('user-c')).toBe(false)
        expect(getRemainingCooldown('user-c')).toBe(0)
    })
})
