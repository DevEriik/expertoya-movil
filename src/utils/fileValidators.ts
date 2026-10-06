import type { OnboardingState, DocumentSlot, DocumentTarget } from '../types/onboarding';

export const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export interface FileMetadataInput {
    uri: string;
    fileSize?: number;
    mimeType?: string;
    fileName?: string;
}

export interface FileValidationResult {
    isValid: boolean;
    errorMessage: string | null;
}

/**
 * Evalúa las reglas de negocio estrictas: JPG/PNG/PDF y máximo 8MB.
 */
export const validateDocumentFile = (file: FileMetadataInput): FileValidationResult => {
    if (!file.uri) {
        return { isValid: false, errorMessage: 'No se ha seleccionado ningún archivo.' };
    }
    const isMimeValid = file.mimeType ? ALLOWED_MIME_TYPES.includes(file.mimeType.toLowerCase()) : false;
    const isExtensionValid = /\.(jpe?g|png|pdf)$/i.test(file.uri);
    if (!isMimeValid && !isExtensionValid) {
        return {
            isValid: false,
            errorMessage: 'Formato no permitido. Solo se admiten archivos JPG, PNG o PDF.',
        };
    }
    if (file.fileSize && file.fileSize > MAX_FILE_SIZE_BYTES) {
        const sizeInMB = (file.fileSize / (1024 * 1024)).toFixed(1);
        return {
            isValid: false,
            errorMessage: `El archivo pesa ${sizeInMB}MB. El límite máximo permitido es de 8MB.`,
        };
    }
    return { isValid: true, errorMessage: null };
};

export const FIELD_HUMAN_LABELS: Record<string, string> = {
    dniFront: 'DNI Frente',
    dniBack: 'DNI Dorso',
    biometricSelfie: 'Selfie Biométrica',
    criminalRecord: 'Antecedentes Penales',
    foodDebtorsCertificate: 'Certificado de Deudores Alimentarios',
    afipProof: 'Constancia de AFIP / ARCA',
};

export interface IncomingFileInfo {
    uri: string;
    fileSize?: number | null;
    fileName?: string | null;
    width?: number;
    height?: number;
}

export interface UniquenessValidationResult {
    isUnique: boolean;
    conflictLabel: string | null;
}

/**
 * Comprueba que el archivo entrante no coincida con ningún DocumentSlot ya cargado y válido.
 */
export const validateDocumentUniqueness = (
    incomingFile: IncomingFileInfo,
    state: OnboardingState,
    currentTarget: DocumentTarget,
    tradeNamesById?: Record<string, string>
): UniquenessValidationResult => {
    const occupiedSlots: Array<{ label: string; slot: DocumentSlot }> = [];

    (Object.keys(state.identity) as Array<keyof OnboardingState['identity']>).forEach((field) => {
        const isSelf = currentTarget.target === 'identity' && currentTarget.field === field;
        const slot = state.identity[field];
        if (!isSelf && slot.uri && slot.status === 'valid') {
            occupiedSlots.push({ label: FIELD_HUMAN_LABELS[field] ?? field, slot });
        }
    });

    const isSelfFiscal = currentTarget.target === 'fiscal';
    if (!isSelfFiscal && state.fiscal.afipProof.uri && state.fiscal.afipProof.status === 'valid') {
        occupiedSlots.push({ label: FIELD_HUMAN_LABELS.afipProof, slot: state.fiscal.afipProof });
    }
    Object.entries(state.trades.licenses).forEach(([tradeId, slot]) => {
        const isSelfLicense = currentTarget.target === 'license' && currentTarget.tradeId === tradeId;
        if (!isSelfLicense && slot.uri && slot.status === 'valid') {
            const tradeName = tradeNamesById?.[tradeId]
                ? `Matrícula de ${tradeNamesById[tradeId]}`
                : `Matrícula (${tradeId})`;
            occupiedSlots.push({ label: tradeName, slot });
        }
    });

    for (const item of occupiedSlots) {
        const existing = item.slot;

        const isExactUri = existing.uri === incomingFile.uri;
        const isExactFileSize =
            Boolean(incomingFile.fileSize) &&
            Boolean(existing.fileSize) &&
            incomingFile.fileSize === existing.fileSize;

        const isExactNameAndSize =
            isExactFileSize &&
            Boolean(incomingFile.fileName) &&
            incomingFile.fileName === existing.fileName;

        const isSameDimensionsAndSize =
            isExactFileSize &&
            Boolean(incomingFile.width) &&
            incomingFile.width === existing.metadata?.width &&
            incomingFile.height === existing.metadata?.height;

        if (isExactUri || isExactNameAndSize || isSameDimensionsAndSize) {
            return {
                isUnique: false,
                conflictLabel: item.label,
            };
        }
    }

    return { isUnique: true, conflictLabel: null };
};