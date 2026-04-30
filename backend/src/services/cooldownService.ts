// In-memory Cooldown – to be replaced by redis
// key: userId, value: timestamp when cooldown terminates
const cooldowns = new Map<string, number>()

const COOLDOWN_MS = 30_000  // 30s

export function isOnCooldown(userId: string): boolean {
    const until = cooldowns.get(userId)
    if (!until) return false
    if (Date.now() > until) {
        cooldowns.delete(userId)
        return false
    }
    return true
}

export function getRemainingCooldown(userId: string): number {
    const until = cooldowns.get(userId)
    if (!until) return 0
    const remaining = until - Date.now()
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0
}

export function setCooldown(userId: string): void {
    cooldowns.set(userId, Date.now() + COOLDOWN_MS)
}

