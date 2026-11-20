import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';

export const saveToken = async (key: string, value: string) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await Keychain.setGenericPassword(key, value, { service: key });
    }
  } catch (error) {
    console.error('Error saving token', error);
  }
};

export const getToken = async (key: string) => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      const credentials = await Keychain.getGenericPassword({ service: key });
      return credentials ? credentials.password : null;
    }
  } catch (error) {
    console.error('Error getting token', error);
    return null;
  }
};

export const deleteToken = async (key: string) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await Keychain.resetGenericPassword({ service: key });
    }
  } catch (error) {
    console.error('Error deleting token', error);
  }
};
