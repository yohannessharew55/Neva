import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neva.livotion',
  appName: 'NEVA',
  webDir: 'dist',
  server: {
    url: 'https://neva-os.vercel.app/',
    cleartext: true,
    androidScheme: 'https',
    iosScheme: 'capacitor',
    allowNavigation: [
      'neva-os.vercel.app',
      '*.vercel.app'
    ]
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
