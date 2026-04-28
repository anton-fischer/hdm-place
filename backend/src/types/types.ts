export interface Pixel {
    x: number
    y: number
    color: string       // hex, z.B. "#FF0000"
    placedBy: string    // userId
    placedAt: number    // timestamp
}

export interface WebSocketEvent {
    type: 'pixel:placed'
    payload: Pixel
}