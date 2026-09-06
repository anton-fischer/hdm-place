import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('logger', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('logs, warns and errors when logging is enabled', async () => {
        vi.doMock('../../config', () => ({ ENABLE_LOGGING: true }))
        const Logger = await import('../../utils/logger')
        Logger.log('hello')
        Logger.warn('careful')
        Logger.error('oops')

        expect(console.log).toHaveBeenCalledTimes(1)
        expect((console.log as any).mock.calls[0][0]).toContain('hello')
        expect(console.warn).toHaveBeenCalledTimes(1)
        expect(console.error).toHaveBeenCalledTimes(1)
    })

    it('does not log anything when logging is disabled', async () => {
        vi.doMock('../../config', () => ({ ENABLE_LOGGING: false }))
        const Logger = await import('../../utils/logger')
        Logger.log('hello')
        Logger.warn('careful')
        Logger.error('oops')

        expect(console.log).not.toHaveBeenCalled()
        expect(console.warn).not.toHaveBeenCalled()
        expect(console.error).not.toHaveBeenCalled()
    })
})
