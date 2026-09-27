import type { OnboardingState, Trade } from '../types/onboarding';

/**
 * NIVEL 1: Identidad Básica y Antecedentes Legales
 * Todos los documentos son estrictamente obligatorios (status === 'valid'):
 * 1. DNI Frente
 * 2. DNI Dorso
 * 3. Selfie Biométrica
 * 4. Certificado de Antecedentes Penales
 * 5. Certificado de No Deudor Alimentario (RDAM)
 */
export const canAdvanceLevel1 = (identity: OnboardingState['identity']): boolean => {
    const isDniFrontValid = identity.dniFront.status === 'valid';
    const isDniBackValid = identity.dniBack.status === 'valid';
    const isSelfieValid = identity.biometricSelfie.status === 'valid';
    const isCriminalRecordValid = identity.criminalRecord.status === 'valid';
    const isFoodDebtorsValid = identity.foodDebtorsCertificate.status === 'valid';
    return (
        isDniFrontValid &&
        isDniBackValid &&
        isSelfieValid &&
        isCriminalRecordValid &&
        isFoodDebtorsValid
    );
};

/**
 * NIVEL 2: Oficios y Matrículas Condicionales
 * - Debe haber seleccionado al menos 1 oficio.
 * - Por cada oficio seleccionado que requiera matrícula legal,
 *   su slot correspondiente en 'licenses' debe estar 'valid'.
 */
export const canAdvanceLevel2 = (
    tradesState: OnboardingState['trades'],
    catalog: Trade[]
): boolean => {
    const { selectedTradeIds, licenses } = tradesState;

    if (selectedTradeIds.length === 0) {
        return false;
    }

    return selectedTradeIds.every((tradeId) => {
        const tradeConfig = catalog.find((t) => t.id === tradeId);

        if (!tradeConfig || !tradeConfig.requiresLicense) {
            return true;
        }

        const licenseSlot = licenses[tradeId];
        return licenseSlot && licenseSlot.status === 'valid';
    });
};

/**
 * NIVEL 3: Situación Fiscal
 * - CUIT no vacío (puedes sumar regex de CUIT argentino más adelante).
 * - Constancia de AFIP / Monotributo obligatoria con status 'valid'.
 */
export const canAdvanceLevel3 = (fiscal: OnboardingState['fiscal']): boolean => {
    const isCuitProvided = fiscal.cuit.trim().length > 0;
    const isAfipValid = fiscal.afipProof.status === 'valid';

    return isCuitProvided && isAfipValid;
};

/**
 * Evalúa si el usuario puede avanzar según en qué 'currentStep' se encuentre.
 */
export const canAdvanceCurrentStep = (
    state: OnboardingState,
    catalog: Trade[]
): boolean => {
    switch (state.currentStep) {
        case 1:
            return canAdvanceLevel1(state.identity);
        case 2:
            return canAdvanceLevel2(state.trades, catalog);
        case 3:
            return canAdvanceLevel3(state.fiscal);
        default:
            return false;
    }
};
