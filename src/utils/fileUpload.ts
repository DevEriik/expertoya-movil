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

  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return blob;
  } catch (err) {
    console.warn('[createFormDataFile] Fallback a objeto FormData RN:', err);
  }

  return {
    uri,
    name: fileName,
    type: mimeType,
  };
}
