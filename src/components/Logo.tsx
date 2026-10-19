import React from 'react';
import { useColorScheme, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

const logoLight = require('@/assets/images/logos/logo-expertoya-light.svg');
const logoDark = require('@/assets/images/logos/logo-expertoya-dark.svg');

interface LogoProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({ width = 180, height = 40, style }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Image
        source={isDark ? logoDark : logoLight}
        style={styles.image}
        contentFit="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default Logo;
