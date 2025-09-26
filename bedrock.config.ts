// bedrock.config.ts (교체)
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'snakegame',

  brand: {
    displayName: '스네이크 게임',
    primaryColor: '#3182F6',
    icon: 'https://static.toss.im/favicon/favicon-32x32.png', // ← null 금지
    bridgeColorMode: 'basic'
  },

  web: {
    host: 'localhost',
    port: 3000,
    commands: {
      dev: 'react-scripts start',
      build: 'react-scripts build'
    }
  },

  outdir: 'build',
  permissions: []
});
