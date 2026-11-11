import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    reporters: 'verbose',
    // A shared external Postgres (TEST_DATABASE_URL) is rebuilt per file, so files
    // must not run concurrently. The embedded PGlite path is isolated per worker.
    fileParallelism: !process.env.TEST_DATABASE_URL,
  },
});
