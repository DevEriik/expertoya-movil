import { useReducer, useMemo } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import type {
    OnboardingState,
    DocumentSlot,
    DocumentTarget,
    DocumentAuditMetadata,
} from '../types/onboarding';

import { onboardingReducer, initialOnboardingState } from '../reducers/onboardingReducer';
import { TRADES_CATALOG_MOCK } from '../constants/tradesMock';

import { validateDocumentFile, validateDocumentUniqueness } from '../utils/fileValidators';
import { canAdvanceCurrentStep } from '../utils/stepValidators';

export type { DocumentTarget } from '../types/onboarding';

export const useOnboarding = () => {
    const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState);

    const canAdvance = useMemo(() => {
        return canAdvanceCurrentStep(state, TRADES_CATALOG_MOCK);
    }, [state]);

    const tradeNamesMap = useMemo(() => {
        return TRADES_CATALOG_MOCK.reduce<Record<string, string>>((acc, trade) => {
            acc[trade.id] = trade.name;
            return acc;
        }, {});
    }, []);

    /**
     * Captura de imagen mediante cámara o galería con expo-image-picker.
     * Incluye validación técnica (formato/peso), validación de unicidad cruzada
     * y extracción de metadatos EXIF para auditoría.
     */
    const pickDocument = async (
        target: DocumentTarget,
        source: 'camera' | 'gallery' = 'camera'
    ) => {
        try {
            if (source === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    alert('Se requiere permiso para acceder a la cámara.');
                    return;
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    alert('Se requiere permiso para acceder a la galería de fotos.');
                    return;
                }
            }

            const options: ImagePicker.ImagePickerOptions = {
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
                exif: true,
            };

            const result =
                source === 'camera'
                    ? await ImagePicker.launchCameraAsync(options)
                    : await ImagePicker.launchImageLibraryAsync(options);

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            const asset = result.assets[0];

            const fileValidation = validateDocumentFile({
                uri: asset.uri,
                fileSize: asset.fileSize,
                mimeType: asset.mimeType,
                fileName: asset.fileName ?? 'documento.jpg',
            });

            const uniquenessValidation = validateDocumentUniqueness(
                {
                    uri: asset.uri,
                    fileSize: asset.fileSize,
                    fileName: asset.fileName,
                    width: asset.width,
                    height: asset.height,
                },
                state,
                target,
                tradeNamesMap
            );

            let status: DocumentSlot['status'] = 'valid';
            let errorMessage: string | null = null;

            if (!fileValidation.isValid) {
                status = 'invalid';
                errorMessage = fileValidation.errorMessage;
            } else if (!uniquenessValidation.isUnique) {
                status = 'invalid';
                errorMessage = `Este archivo ya fue cargado en "${uniquenessValidation.conflictLabel}". Debes subir un documento diferente.`;
            }

            const metadata: DocumentAuditMetadata = {
                capturedAt: new Date().toISOString(),
                source,
                width: asset.width,
                height: asset.height,
                exif: asset.exif
                    ? {
                        dateTimeOriginal: asset.exif.DateTimeOriginal as string | undefined,
                        deviceMake: asset.exif.Make as string | undefined,
                        deviceModel: asset.exif.Model as string | undefined,
                        software: asset.exif.Software as string | undefined,
                        hasLocation: Boolean(asset.exif.GPSLatitude && asset.exif.GPSLongitude),
                    }
                    : null,
            };

            const slot: DocumentSlot = {
                uri: asset.uri,
                fileSize: asset.fileSize ?? null,
                mimeType: asset.mimeType ?? 'image/jpeg',
                fileName: asset.fileName ?? 'documento.jpg',
                status,
                errorMessage,
                metadata,
            };

            dispatch({
                type: 'SET_DOCUMENT',
                payload: { ...target, slot },
            });
        } catch (error) {
            console.error('Error al capturar el documento:', error);
        }
    };

    /**
     * Selección de archivo digital (PDF o imagen) mediante expo-document-picker.
     */
    const pickDocumentFile = async (target: DocumentTarget) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/jpeg', 'image/png'],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            const asset = result.assets[0];

            const fileValidation = validateDocumentFile({
                uri: asset.uri,
                fileSize: asset.size,
                mimeType: asset.mimeType,
                fileName: asset.name,
            });

            const uniquenessValidation = validateDocumentUniqueness(
                {
                    uri: asset.uri,
                    fileSize: asset.size,
                    fileName: asset.name,
                },
                state,
                target,
                tradeNamesMap
            );

            let status: DocumentSlot['status'] = 'valid';
            let errorMessage: string | null = null;

            if (!fileValidation.isValid) {
                status = 'invalid';
                errorMessage = fileValidation.errorMessage;
            } else if (!uniquenessValidation.isUnique) {
                status = 'invalid';
                errorMessage = `Este archivo ya fue cargado en "${uniquenessValidation.conflictLabel}". Debes subir un documento diferente.`;
            }

            const metadata: DocumentAuditMetadata = {
                capturedAt: new Date().toISOString(),
                source: 'file',
                exif: null,
            };

            const slot: DocumentSlot = {
                uri: asset.uri,
                fileSize: asset.size ?? null,
                mimeType: asset.mimeType ?? 'application/pdf',
                fileName: asset.name,
                status,
                errorMessage,
                metadata,
            };

            dispatch({
                type: 'SET_DOCUMENT',
                payload: { ...target, slot },
            });
        } catch (error) {
            console.error('Error al seleccionar el documento:', error);
        }
    };

    const removeDocument = (target: DocumentTarget) => {
        dispatch({ type: 'REMOVE_DOCUMENT', payload: target });
    };

    const toggleTrade = (tradeId: string, requiresLicense: boolean) => {
        dispatch({ type: 'TOGGLE_TRADE', payload: { tradeId, requiresLicense } });
    };

    const setCuit = (cuit: string) => {
        dispatch({ type: 'SET_CUIT', payload: cuit });
    };

    const handleNextStep = () => {
        if (!canAdvance) return;
        if (state.currentStep < 3) {
            dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
        }
    };

    const handlePrevStep = () => {
        if (state.currentStep > 1) {
            dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
        }
    };

    return {
        state,
        canAdvance,
        tradesCatalog: TRADES_CATALOG_MOCK,
        setCuit,
        pickDocument,
        pickDocumentFile,
        removeDocument,
        toggleTrade,
        handleNextStep,
        handlePrevStep,
    };
};
