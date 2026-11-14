import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neva.livotion',
  appName: 'NEVA',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  ios: {
    minVersion: '16.0',
    preferredContentMode: 'mobile',
    backgroundColor: '#0a0f1d',
    handleApplicationURL: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#3b82f6',
      sound: 'alarm_bell.wav'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0f1d'
    }
  }
};

export default config;
