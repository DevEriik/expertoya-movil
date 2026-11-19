import './global.css';
import { AppRegistry } from 'react-native';
import ioniconsFont from 'react-native-vector-icons/Fonts/Ionicons.ttf';
import materialCommunityIconsFont from 'react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf';
import App from './App';
import { name as appName } from '../app.json';

// Asegurar compatibilidad con librerías que esperan global o __DEV__ en web
if (typeof (globalThis as any).global === 'undefined') {
  (globalThis as any).global = globalThis;
}

// Registrar fuentes de react-native-vector-icons en el DOM
const iconFontStyles = `
@font-face {
  font-family: 'Ionicons';
  src: url(${ioniconsFont}) format('truetype');
}
@font-face {
  font-family: 'MaterialCommunityIcons';
  src: url(${materialCommunityIconsFont}) format('truetype');
}
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(iconFontStyles));
  document.head.appendChild(style);
}

AppRegistry.registerComponent(appName, () => App);
AppRegistry.runApplication(appName, {
  rootTag: document.getElementById('root'),
});
