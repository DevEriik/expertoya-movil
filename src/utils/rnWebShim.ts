export * from 'react-native-web';
import * as RNWeb from 'react-native-web';

export const PermissionsAndroid = {
  PERMISSIONS: {},
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    NEVER_ASK_AGAIN: 'never_ask_again',
  },
  request: async () => 'granted',
  requestMultiple: async () => ({}),
  check: async () => true,
};

export default RNWeb;
