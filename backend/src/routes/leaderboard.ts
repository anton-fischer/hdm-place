import type {FastifyInstance} from 'fastify'
import { getLeaderboard } from '../services/pixelService.js'

export async function leaderboardRoutes(app: FastifyInstance) {

    // GET /api/leaderboard – Top 10 users by pixel count
    app.get('/api/leaderboard', async () => {
        return getLeaderboard()
    })
}