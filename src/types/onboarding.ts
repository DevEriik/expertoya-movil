export type DocumentStatus = 'empty' | 'valid' | 'invalid';

export type DocumentCaptureSource = 'camera' | 'gallery' | 'file';

export interface DocumentAuditMetadata {
    capturedAt: string;
    source: DocumentCaptureSource;
    width?: number;
    height?: number;
    exif?: {
        dateTimeOriginal?: string;
        deviceMake?: string;
        deviceModel?: string;
        software?: string;
        hasLocation?: boolean;
    } | null;
}

export interface DocumentSlot {
    uri: string | null;
    mimeType: string | null;
    fileSize: number | null;
    fileName: string | null;
    status: DocumentStatus;
    errorMessage: string | null;
    metadata?: DocumentAuditMetadata | null;
}


export interface Trade {
    id: string;
    name: string;
    requiresLicense: boolean;
    licenseAuthority?: string;
}

export interface OnboardingState {
    currentStep: number;
    identity: {
        dniFront: DocumentSlot;
        dniBack: DocumentSlot;
        biometricSelfie: DocumentSlot;
        criminalRecord: DocumentSlot;
        foodDebtorsCertificate: DocumentSlot;
    };
    trades: {
        selectedTradeIds: string[];
        licenses: Record<string, DocumentSlot>;
    };
    fiscal: {
        cuit: string;
        afipProof: DocumentSlot;
    };
}

export type DocumentTarget =
    | { target: 'identity'; field: keyof OnboardingState['identity'] }
    | { target: 'fiscal'; field: 'afipProof' }
    | { target: 'license'; tradeId: string };

export type OnboardingAction =
    | ({
        type: 'SET_DOCUMENT';
    } & { payload: DocumentTarget & { slot: DocumentSlot } })
    | {
        type: 'REMOVE_DOCUMENT';
        payload: DocumentTarget;
    }

    | {
        type: 'TOGGLE_TRADE';
        payload: { tradeId: string; requiresLicense: boolean };
    }
    | {
        type: 'SET_STEP';
        payload: number;
    }
    | {
        type: 'SET_CUIT';
        payload: string;
    };
