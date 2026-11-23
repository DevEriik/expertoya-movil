import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NATIVE_ONLY_MODULES = new Set([
  'react-native-bootsplash',
  'react-native-config',
  'react-native-keychain',
  'react-native-geolocation-service',
  'react-native-image-picker',
  'react-native-audio-recorder-player',
  'react-native-background-timer',
  '@react-native-documents/picker',
  '@react-native-firebase/app',
  '@react-native-firebase/messaging',
  '@notifee/react-native',
  '@react-native-community/datetimepicker',
  '@daily-co/react-native-daily-js',
  '@daily-co/react-native-webrtc',
  'react-native-webrtc',
]);

const JSX_IN_NODE_MODULES = [
  'react-native-vector-icons',
  'react-native-calendars',
  'react-native-swipe-gestures',
];

function nativeStubsPlugin() {
  const stubPrefix = '\0web-stub:';

  return {
    name: 'native-stubs',
    enforce: 'pre',
    resolveId(source) {
      if (NATIVE_ONLY_MODULES.has(source)) {
        return `${stubPrefix}${source}`;
      }
      return null;
    },
    load(id) {
      if (!id.startsWith(stubPrefix)) return null;
      return `
        const noop = async () => null;
        const stub = new Proxy(function () { return null; }, {
          get(_target, prop) {
            if (prop === '__esModule') return true;
            if (prop === 'default') return stub;
            if (prop === 'then') return undefined;
            return noop;
          },
          apply() { return null; }
        });
        export default stub;
        export const pick = noop;
        export const types = {};
        export const getMessaging = () => ({});
        export const getToken = noop;
        export const onMessage = () => () => {};
        export const requestPermission = async () => 1;
        export const hide = noop;
        export const scheduleOnRN = (fn, ...args) => fn(...args);
        export const AndroidImportance = { DEFAULT: 3, HIGH: 4, LOW: 2, MIN: 1, NONE: 0 };
        export const AuthorizationStatus = { AUTHORIZED: 1, DENIED: 0, NOT_DETERMINED: -1, PROVISIONAL: 2 };
        export const EventType = { PRESS: 1, DISMISSED: 0, ACTION_PRESS: 2 };
        export const launchCamera = async () => ({ didCancel: true });
        export const launchImageLibrary = async () => ({ didCancel: true });
        export const setGenericPassword = noop;
        export const getGenericPassword = noop;
        export const resetGenericPassword = noop;
      `;
    },
  };
}

function rnJsxTransformPlugin() {
  return {
    name: 'rn-jsx-transform',
    enforce: 'pre',
    async transform(code, id) {
      if (
        id.endsWith('.js') &&
        id.includes('node_modules') &&
        JSX_IN_NODE_MODULES.some((pkg) => id.includes(pkg))
      ) {
        return transformWithOxc(code, id, {
          lang: 'jsx',
          jsx: { runtime: 'automatic' },
        });
      }
      return null;
    },
  };
}

function rnRequireTransformPlugin() {
  return {
    name: 'rn-require-transform',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes(`${path.sep}src${path.sep}`) && !id.includes('/src/')) {
        return null;
      }
      if (!/\.(tsx?|jsx?)$/.test(id)) return null;
      if (!code.includes('require(')) return null;

      const imports = [];
      let counter = 0;
      const transformed = code.replace(
        /\brequire\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
        (_match, _quote, spec) => {
          const varName = `__vite_req_${counter++}`;
          const isAsset = /\.(png|jpe?g|gif|webp|svg|ttf|otf|woff2?)$/i.test(spec);
          if (isAsset) {
            imports.push(`import ${varName} from '${spec}';`);
          } else {
            imports.push(`import * as ${varName} from '${spec}';`);
          }
          return varName;
        },
      );

      if (imports.length === 0) return null;
      return {
        code: `${imports.join('\n')}\n${transformed}`,
        map: null,
      };
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  return {
    plugins: [nativeStubsPlugin(), rnRequireTransformPlugin(), rnJsxTransformPlugin(), react()],
    define: {
      global: 'globalThis',
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.API_URL': JSON.stringify(env.API_URL || ''),
    },
    resolve: {
      extensions: [
        '.web.tsx',
        '.web.ts',
        '.web.jsx',
        '.web.js',
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
        '.json',
      ],
      alias: {
        'react-native': path.resolve(__dirname, 'src/utils/rnWebShim.ts'),
        '@/assets': path.resolve(__dirname, 'assets'),
        '@': path.resolve(__dirname, 'src'),
      },
    },
    optimizeDeps: {
      exclude: Array.from(NATIVE_ONLY_MODULES),
      rolldownOptions: {
        moduleTypes: {
          '.js': 'jsx',
        },
        resolve: {
          extensions: [
            '.web.tsx',
            '.web.ts',
            '.web.jsx',
            '.web.js',
            '.tsx',
            '.ts',
            '.jsx',
            '.js',
            '.json',
          ],
        },
      },
    },
    server: {
      port: 5173,
      open: false,
    },
  };
});