module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@/assets': './assets',
          '@': './src',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
