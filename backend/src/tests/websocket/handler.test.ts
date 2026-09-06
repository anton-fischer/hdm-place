import { describe, it, expect, afterEach } from 'vitest'
import { WebSocket } from 'ws'
import { buildApp } from '../../app.js'
import { broadcast } from '../../websocket/handler.js'

function waitForMessage(socket: WebSocket): Promise<any> {
    return new Promise((resolve) => {
        socket.once('message', (data) => resolve(JSON.parse(data.toString())))
    })
}

function waitForOpen(socket: WebSocket): Promise<void> {
    return new Promise((resolve) => socket.once('open', () => resolve()))
}

describe('websocket handler', () => {
    let app: Awaited<ReturnType<typeof buildApp>> | undefined

    afterEach(async () => {
        await app?.close()
        app = undefined
    })

    it('sends a welcome message with a timestamp on connect', async () => {
        app = await buildApp()
        const address = await app.listen({ port: 0 })
        const socket = new WebSocket(`${address.replace('http', 'ws')}/ws`)
        const opened = waitForOpen(socket)
        const welcome = waitForMessage(socket) // attach listener before awaiting open to avoid missing the message
        await opened

        const message = await welcome
        expect(message.type).toBe('connected')
        expect(typeof message.timestamp).toBe('number')

        socket.close()
    })

    it('delivers broadcast events to connected clients', async () => {
        app = await buildApp()
        const address = await app.listen({ port: 0 })
        const socket = new WebSocket(`${address.replace('http', 'ws')}/ws`)
        const opened = waitForOpen(socket)
        const welcome = waitForMessage(socket)
        await opened
        await welcome // consume the welcome message

        const nextMessage = waitForMessage(socket)
        const event = { type: 'pixel:placed' as const, payload: { x: 1, y: 1, color: '#ff0000', placedBy: 'user', placedAt: Date.now() } }
        broadcast(event)

        expect(await nextMessage).toEqual(event)
        socket.close()
    })

    it('does not throw when broadcasting after a client disconnects', async () => {
        app = await buildApp()
        const address = await app.listen({ port: 0 })
        const socket = new WebSocket(`${address.replace('http', 'ws')}/ws`)
        const opened = waitForOpen(socket)
        const welcome = waitForMessage(socket)
        await opened
        await welcome // consume the welcome message

        const closed = new Promise((resolve) => socket.once('close', resolve))
        socket.close()
        await closed

        expect(() => broadcast({ type: 'pixel:placed', payload: { x: 0, y: 0, color: '#000000', placedBy: 'user', placedAt: Date.now() } })).not.toThrow()
    })
})
