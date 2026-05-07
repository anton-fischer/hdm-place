import type { FastifyInstance } from 'fastify'
import { WebSocket } from 'ws'
import type {WebSocketEvent} from '../types/types.js'

// All active WebSocket connections on this server
const clients = new Set<WebSocket>()

// Called by routes to notify clients
export function broadcast(event: WebSocketEvent): void {
    const message = JSON.stringify(event)
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message)
        }
    }
}

export async function websocketHandler(app: FastifyInstance) {

    // GET /ws - Create ws connection
    app.get('/ws', { websocket: true }, (socket) => {
        clients.add(socket)
        console.log(`Client connected. Count: ${clients.size}`)

        // Welcome msg with timestamp
        socket.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }))

        socket.on('close', () => {
            clients.delete(socket)
            console.log(`Client disconnected. Count: ${clients.size}`)
        })

        socket.on('error', (err) => {
            console.error('WebSocket error:', err)
            clients.delete(socket)
        })
    })
}