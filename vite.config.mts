import { buildConfig, solidPane } from 'solidos-toolkit/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: solidPane({
    litDecoratorPaths: ['src/components'],
    sandbox: {
      subject: 'https://sharontest.solidcommunity.net/chattest2/index.ttl'
    }
  }),
  build: buildConfig({ entry: 'src/index.ts' }),
  test: {
    environment: 'jsdom',
    setupFiles: ['test/helpers/setup.ts'],
    coverage: {
      include: ['src/**/*.[jt]s']
    }
  }
})
