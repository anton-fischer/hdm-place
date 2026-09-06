import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: ['./vitest.setup.ts'],
        // tests share one Postgres database, so they must not run concurrently
        fileParallelism: false,
        testTimeout: 15000
    }
})
