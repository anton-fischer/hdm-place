import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export async function userExists(id: string): Promise<boolean> {
    if (!id) return false
    const user = await prisma.user.findUnique({ where: { id } })
    return !!user
}
