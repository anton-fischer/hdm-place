import { describe, it, expect, vi, beforeEach } from 'vitest'

const toastMocks = vi.hoisted(() => ({
    promise: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
}))

vi.mock('react-hot-toast', () => ({ default: toastMocks }))

describe('toast', () => {
    beforeEach(() => {
        vi.resetModules()
        toastMocks.promise.mockClear()
        toastMocks.success.mockClear()
        toastMocks.error.mockClear()
    })

    it('shows notifications when enabled', async () => {
        vi.doMock('../../config', () => ({ ENABLE_NOTIFICATIONS: true }))
        const { notifyPromise, notifySuccess, notifyError } = await import('../../utils/toast')

        const promise = Promise.resolve('ok')
        notifyPromise(promise, 'done', 'loading')
        notifySuccess('yay')
        notifyError('nope')

        expect(toastMocks.promise).toHaveBeenCalledWith(promise, expect.objectContaining({ loading: 'loading', success: 'done' }))
        expect(toastMocks.success).toHaveBeenCalledWith('yay')
        expect(toastMocks.error).toHaveBeenCalledWith('nope')
    })

    it('does nothing when notifications are disabled', async () => {
        vi.doMock('../../config', () => ({ ENABLE_NOTIFICATIONS: false }))
        const { notifyPromise, notifySuccess, notifyError } = await import('../../utils/toast')

        notifyPromise(Promise.resolve('ok'))
        notifySuccess('yay')
        notifyError('nope')

        expect(toastMocks.promise).not.toHaveBeenCalled()
        expect(toastMocks.success).not.toHaveBeenCalled()
        expect(toastMocks.error).not.toHaveBeenCalled()
    })
})
