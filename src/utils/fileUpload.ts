import { Platform } from 'react-native';
/**
 * Prepara una parte de archivo válida para FormData compatible con el runtime
 * de Fetch en React Native y Web.
 */
export async function createFormDataFile(
  uriOrBlob: any,
  fileName: string,
  mimeType: string,
): Promise<Blob | any> {
  if (uriOrBlob instanceof Blob) {
    return uriOrBlob;
  }
  const uri = typeof uriOrBlob === 'string' ? uriOrBlob : uriOrBlob?.uri;
  if (!uri) {
    throw new Error('URI de archivo no válida para FormData');
  }
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    return await res.blob();
  }
  const normalizedUri =
    uri.startsWith('file://') ||
      uri.startsWith('content://') ||
      uri.startsWith('http')
      ? uri
      : `file://${uri}`;
  return {
    uri: normalizedUri,
    name: fileName,
    type: mimeType,
  };
}
