import { PermissionsAndroid, Platform } from 'react-native';
import {
  launchCamera as rnLaunchCamera,
  launchImageLibrary as rnLaunchImageLibrary,
  type CameraOptions,
  type ImageLibraryOptions,
} from 'react-native-image-picker';
import { pick, types as docTypes } from '@react-native-documents/picker';

export interface PickedMediaAsset {
  uri: string;
  fileName?: string;
  name: string;
  mimeType?: string;
  type?: string;
  fileSize?: number;
  size?: number;
  width?: number;
  height?: number;
  base64?: string;
  exif?: Record<string, any>;
  file?: File;
}

export interface MediaPickerResult {
  canceled: boolean;
  assets: PickedMediaAsset[];
}

export async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (Platform.Version >= 33) {
    return true;
  }
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export async function pickImageFromLibrary(options?: {
  quality?: number;
  allowsMultipleSelection?: boolean;
  mediaType?: 'photo' | 'video' | 'mixed';
  includeBase64?: boolean;
}): Promise<MediaPickerResult> {
  const libOptions: ImageLibraryOptions = {
    mediaType: options?.mediaType ?? 'photo',
    quality: (options?.quality ?? 0.8) as ImageLibraryOptions['quality'],
    selectionLimit: options?.allowsMultipleSelection ? 5 : 1,
    includeBase64: options?.includeBase64 ?? false,
  };

  const res = await rnLaunchImageLibrary(libOptions);
  if (res.didCancel || !res.assets || res.assets.length === 0) {
    return { canceled: true, assets: [] };
  }

  return {
    canceled: false,
    assets: res.assets
      .filter((a) => !!a.uri)
      .map((a) => ({
        uri: a.uri!,
        fileName: a.fileName,
        name: a.fileName || 'image.jpg',
        mimeType: a.type,
        type: a.type,
        fileSize: a.fileSize,
        size: a.fileSize,
        width: a.width,
        height: a.height,
        base64: a.base64,
      })),
  };
}

export async function takePhotoWithCamera(options?: {
  quality?: number;
  includeBase64?: boolean;
}): Promise<MediaPickerResult> {
  const hasPerm = await requestCameraPermission();
  if (!hasPerm) {
    return { canceled: true, assets: [] };
  }

  const camOptions: CameraOptions = {
    mediaType: 'photo',
    quality: (options?.quality ?? 0.8) as CameraOptions['quality'],
    includeBase64: options?.includeBase64 ?? false,
    saveToPhotos: false,
  };

  const res = await rnLaunchCamera(camOptions);
  if (res.didCancel || !res.assets || res.assets.length === 0) {
    return { canceled: true, assets: [] };
  }

  return {
    canceled: false,
    assets: res.assets
      .filter((a) => !!a.uri)
      .map((a) => ({
        uri: a.uri!,
        fileName: a.fileName,
        name: a.fileName || 'photo.jpg',
        mimeType: a.type,
        type: a.type,
        fileSize: a.fileSize,
        size: a.fileSize,
        width: a.width,
        height: a.height,
        base64: a.base64,
      })),
  };
}

export async function pickDocumentFile(options?: {
  type?: string[];
}): Promise<MediaPickerResult> {
  try {
    const typeMap: any[] = [];
    const requested = options?.type ?? ['*/*'];
    if (requested.some((t) => t.includes('pdf'))) typeMap.push(docTypes.pdf);
    if (requested.some((t) => t.includes('image'))) typeMap.push(docTypes.images);
    if (typeMap.length === 0) typeMap.push(docTypes.allFiles);

    const results = await pick({ type: typeMap });
    if (!results || results.length === 0) {
      return { canceled: true, assets: [] };
    }

    return {
      canceled: false,
      assets: results.map((r) => ({
        uri: r.uri,
        name: r.name || 'documento',
        fileName: r.name || 'documento',
        mimeType: r.type ?? undefined,
        type: r.type ?? undefined,
        fileSize: r.size ?? undefined,
        size: r.size ?? undefined,
      })),
    };
  } catch (err: any) {
    if (err?.code === 'OPERATION_CANCELED' || /cancel/i.test(String(err?.message))) {
      return { canceled: true, assets: [] };
    }
    throw err;
  }
}

export type ImagePickerAsset = PickedMediaAsset;
export type DocumentPickerAsset = PickedMediaAsset;
export type ImagePickerOptions = {
  mediaTypes?: any;
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
  base64?: boolean;
  exif?: boolean;
};

export const ImagePicker = {
  MediaTypeOptions: {
    Images: 'photo' as const,
    Videos: 'video' as const,
    All: 'mixed' as const,
  },
  requestCameraPermissionsAsync: async () => {
    const ok = await requestCameraPermission();
    return { status: ok ? ('granted' as const) : ('denied' as const), granted: ok };
  },
  requestMediaLibraryPermissionsAsync: async () => {
    const ok = await requestMediaLibraryPermission();
    return { status: ok ? ('granted' as const) : ('denied' as const), granted: ok };
  },
  launchImageLibraryAsync: (options?: ImagePickerOptions) =>
    pickImageFromLibrary({
      quality: options?.quality,
      allowsMultipleSelection: options?.allowsMultipleSelection,
      includeBase64: options?.base64,
    }),
  launchCameraAsync: (options?: ImagePickerOptions) =>
    takePhotoWithCamera({
      quality: options?.quality,
      includeBase64: options?.base64,
    }),
  getPendingResultAsync: async (): Promise<MediaPickerResult | null> => null,
};

export namespace ImagePicker {
  export type ImagePickerAsset = PickedMediaAsset;
  export type ImagePickerOptions = {
    mediaTypes?: any;
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    allowsMultipleSelection?: boolean;
    base64?: boolean;
    exif?: boolean;
  };
}

export const DocumentPicker = {
  getDocumentAsync: (options?: {
    type?: string | string[];
    copyToCacheDirectory?: boolean;
  }) =>
    pickDocumentFile({
      type: Array.isArray(options?.type)
        ? options.type
        : options?.type
          ? [options.type]
          : undefined,
    }),
};
