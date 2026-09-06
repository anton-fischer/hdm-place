import { describe, it, expect, vi, beforeEach } from 'vitest'

const notifyPromiseMock = vi.hoisted(() => vi.fn())
const loggerMock = vi.hoisted(() => ({ log: vi.fn(), warn: vi.fn(), error: vi.fn() }))

vi.mock('../../config', () => ({ API_URL: 'http://localhost:3001' }))
vi.mock('../../utils/toast', () => ({ notifyPromise: notifyPromiseMock }))
vi.mock('../../utils/logger', () => ({ default: loggerMock }))

import { placePixel, fetchPixel, fetchPixelArea, fetchCooldown, fetchLeaderboard } from '../../utils/api'

function mockFetchOnce(body: any, ok = true) {
    const fetchMock = vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

describe('api', () => {
    beforeEach(() => {
        notifyPromiseMock.mockClear()
        loggerMock.log.mockClear()
        loggerMock.error.mockClear()
        vi.unstubAllGlobals()
    })

    it('placePixel sends a POST request and returns the payload', async () => {
        const fetchMock = mockFetchOnce({ x: 1, y: 2, color: '#ff0000' })
        const result = await placePixel(1, 2, '#ff0000', 'user-a', true)

        expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/pixel', expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x: 1, y: 2, color: '#ff0000', userId: 'user-a' })
        }))
        expect(result).toEqual({ x: 1, y: 2, color: '#ff0000' })
    })

    it('placePixel throws with the server error message when the response is not ok', async () => {
        mockFetchOnce({ error: 'Cooldown is active' }, false)
        await expect(placePixel(1, 2, '#ff0000', 'user-a', true)).rejects.toThrow('Cooldown is active')
    })

    it('placePixel notifies and logs unless quiet is true', async () => {
        mockFetchOnce({ x: 1, y: 2 })
        await placePixel(1, 2, '#ff0000', 'user-a', false)
        expect(notifyPromiseMock).toHaveBeenCalledTimes(1)
        expect(loggerMock.log).toHaveBeenCalledTimes(1)
    })

    it('placePixel suppresses notify/log when quiet is true', async () => {
        mockFetchOnce({ x: 1, y: 2 })
        await placePixel(1, 2, '#ff0000', 'user-a', true)
        expect(notifyPromiseMock).not.toHaveBeenCalled()
    })

    it('fetchPixel sends a GET request to the pixel endpoint', async () => {
        const fetchMock = mockFetchOnce({ x: 3, y: 4 })
        const result = await fetchPixel(3, 4, true)
        expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/pixel/3/4')
        expect(result).toEqual({ x: 3, y: 4 })
    })

    it('fetchPixelArea sends a GET request to the range endpoint', async () => {
        const fetchMock = mockFetchOnce([])
        await fetchPixelArea(0, 0, 5, 5, true)
        expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/pixels/0/0/5/5')
    })

    it('fetchCooldown sends a GET request to the cooldown endpoint', async () => {
        const fetchMock = mockFetchOnce({ userId: 'user-a', isOnCooldown: false, remainingSeconds: 0 })
        await fetchCooldown('user-a', true)
        expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/users/user-a/cooldown')
    })

    it('fetchLeaderboard sends a GET request to the leaderboard endpoint', async () => {
        const fetchMock = mockFetchOnce([])
        await fetchLeaderboard(true)
        expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/leaderboard')
    })

    it('fetchPixel throws and logs on error unless quiet', async () => {
        mockFetchOnce({ error: 'Pixel not found' }, false)
        await expect(fetchPixel(1, 1, false)).rejects.toThrow('Pixel not found')
        expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })
})
