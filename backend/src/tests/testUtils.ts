import { PrismaClient } from '@prisma/client'

export const testPrisma = new PrismaClient()

// order matters: Pixel has a FK to User
export async function resetDb() {
    await testPrisma.pixel.deleteMany()
    await testPrisma.user.deleteMany()
}
