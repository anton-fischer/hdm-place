import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { vi } from 'vitest'

const BASE_ENV = {
    NEXT_PUBLIC_BACKEND_API_URL: 'http://localhost:3001',
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'token',
    NEXT_PUBLIC_ENABLE_NOTIFICATIONS: 'true',
    NEXT_PUBLIC_ENABLE_LOGGING: 'false',
    NEXT_PUBLIC_COUNTDOWN_TIME: '30'
}

const originalEnv = { ...process.env }

async function loadConfig(overrides: Record<string, string | undefined>) {
    const merged: Record<string, string | undefined> = { ...originalEnv, ...BASE_ENV, ...overrides }
    process.env = Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined)) as NodeJS.ProcessEnv
    vi.resetModules()
    return import('../../config')
}

describe('config', () => {
    beforeEach(() => {
        vi.resetModules()
    })

    afterEach(() => {
        process.env = { ...originalEnv }
    })

    it('throws when NEXT_PUBLIC_BACKEND_API_URL is missing', async () => {
        await expect(loadConfig({ NEXT_PUBLIC_BACKEND_API_URL: undefined })).rejects.toThrow('NEXT_PUBLIC_BACKEND_API_URL is missing')
    })

    it('throws when NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is missing', async () => {
        await expect(loadConfig({ NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: undefined })).rejects.toThrow('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is missing')
    })

    it('strips a trailing slash from NEXT_PUBLIC_BACKEND_API_URL', async () => {
        const config = await loadConfig({ NEXT_PUBLIC_BACKEND_API_URL: 'https://example.com/' })
        expect(config.API_URL).toBe('https://example.com')
    })

    it.each([
        ['true', true],
        ['1', true],
        ['false', false],
        ['0', false]
    ])('parses ENABLE_NOTIFICATIONS=%s as %s', async (value, expected) => {
        const config = await loadConfig({ NEXT_PUBLIC_ENABLE_NOTIFICATIONS: value })
        expect(config.ENABLE_NOTIFICATIONS).toBe(expected)
    })

    it('throws when ENABLE_NOTIFICATIONS is not a boolean-like string', async () => {
        await expect(loadConfig({ NEXT_PUBLIC_ENABLE_NOTIFICATIONS: 'maybe' })).rejects.toThrow('must be of type boolean')
    })

    it('throws when ENABLE_LOGGING is not a boolean-like string', async () => {
        await expect(loadConfig({ NEXT_PUBLIC_ENABLE_LOGGING: 'maybe' })).rejects.toThrow('must be of type boolean')
    })

    it('parses a numeric COUNTDOWN_TIME', async () => {
        const config = await loadConfig({ NEXT_PUBLIC_COUNTDOWN_TIME: '45' })
        expect(config.COUNTDOWN_TIME).toBe(45)
    })

    it('throws when COUNTDOWN_TIME is not numeric', async () => {
        await expect(loadConfig({ NEXT_PUBLIC_COUNTDOWN_TIME: 'abc' })).rejects.toThrow('must be numeric')
    })
})
