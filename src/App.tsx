import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import RootNavigator from '@/navigation/RootNavigator';

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      BootSplash.hide({ fade: true }).catch(() => {});
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AccessibilityProvider>
        <RootNavigator />
      </AccessibilityProvider>
    </SafeAreaProvider>
  );
}
