import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.manbhari.app',
  appName: 'Manbhari',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
