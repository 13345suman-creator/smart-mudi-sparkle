import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.650c5b6da3b04cf6a2212ab5f4ec7bf9',
  appName: 'Smart Mudi Khana',
  webDir: 'dist',
  server: {
    url: 'https://smart-mudi-sparkle.lovable.app',
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
