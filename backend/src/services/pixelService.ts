import type {Pixel as PixelType} from '../types/types.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getPixel(x: number, y: number): Promise<PixelType | null> {
    const pixel = await prisma.pixel.findUnique({
        where: { x_y: { x, y } }
    })
    if (!pixel) return null
    return { ...pixel, placedAt: pixel.placedAt.getTime() }
}

export async function getTile(x1: number, y1: number, x2: number, y2: number): Promise<PixelType[]> {
    const pixels = await prisma.pixel.findMany({
        where: {
            x: { gte: x1, lte: x2 },
            y: { gte: y1, lte: y2 }
        }
    })
    return pixels.map(p => ({ ...p, placedAt: p.placedAt.getTime() }))
}

export async function placePixel(x: number, y: number, color: string, userId: string): Promise<PixelType> {
    const [user, pixel] = await prisma.$transaction([
        prisma.user.upsert({
            where: { id: userId },
            update: { pixelCount: { increment: 1 } },
            create: { id: userId, pixelCount: 1 }
        }),
        prisma.pixel.upsert({
            where: { x_y: { x, y } },
            update: { color, placedBy: userId, placedAt: new Date() },
            create: { x, y, color, placedBy: userId }
        })
    ])

    return { ...pixel, placedAt: pixel.placedAt.getTime() }
}

export async function getLeaderboard() {
    return await prisma.user.findMany({
        orderBy: { pixelCount: 'desc' },
        take: 10,
        select: { id: true, pixelCount: true }
    })
}