import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

// applies migrations to the test database (pixel_db_test) before the test suite runs
dotenv.config({ path: fileURLToPath(new URL('../.env.test', import.meta.url)) })

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    shell: true,
    env: process.env
})

process.exit(result.status ?? 1)
