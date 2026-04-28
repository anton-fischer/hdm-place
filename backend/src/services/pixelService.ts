import type {Pixel} from '../types/types.js'

// In-memory store to be replaced by DB
const pixels = new Map<string, Pixel>()
const users = new Map<string, { pixelCount: number }>()

function key(x: number, y: number): string {
    return `${x},${y}`
}

export function getPixel(x: number, y: number): Pixel | null {
    return pixels.get(key(x, y)) ?? null
}

// Returns pixels in a rectangular area
export function getTile(x1: number, y1: number, x2: number, y2: number): Pixel[] {
    const result: Pixel[] = []
    for (const pixel of pixels.values()) {
        if (pixel.x >= x1 && pixel.x <= x2 && pixel.y >= y1 && pixel.y <= y2) {
            result.push(pixel)
        }
    }
    return result
}

export function placePixel(x: number, y: number, color: string, userId: string): Pixel {
    const pixel: Pixel = { x, y, color, placedBy: userId, placedAt: Date.now() }
    pixels.set(key(x, y), pixel)

    // Increase user pixel count
    const user = users.get(userId) ?? { pixelCount: 0 }
    users.set(userId, { pixelCount: user.pixelCount + 1 })

    return pixel
}

export function getLeaderboard(): { userId: string; pixelCount: number }[] {
    return Array.from(users.entries())
        .map(([userId, data]) => ({ userId, pixelCount: data.pixelCount }))
        .sort((a, b) => b.pixelCount - a.pixelCount)
        .slice(0, 10)
}