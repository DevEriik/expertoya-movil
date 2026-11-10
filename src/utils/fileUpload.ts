import { Platform } from 'react-native';

/**
 * Prepara una parte de archivo válida para FormData compatible con el runtime
 * moderno de Fetch (WinterCG) en React Native y Web, evitando el error
 * "Unsupported FormDataPart implementation".
 */
export async function createFormDataFile(
  uriOrBlob: any,
  fileName: string,
  mimeType: string
): Promise<Blob | any> {
  if (uriOrBlob instanceof Blob) {
    return uriOrBlob;
  }

  const uri = typeof uriOrBlob === 'string' ? uriOrBlob : uriOrBlob?.uri;
  if (!uri) {
    throw new Error('URI de archivo no válida para FormData');
  }

  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return blob;
  } catch (err) {
    console.warn('[createFormDataFile] Fallback de fetch a Blob:', err);
  }

  try {
    const { File } = require('expo-file-system');
    if (File) {
      return new File(uri);
    }
  } catch (_) {}

  return {
    uri,
    name: fileName,
    type: mimeType,
  };
}

