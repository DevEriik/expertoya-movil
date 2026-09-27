import type { Trade } from '../types/onboarding';

export const TRADES_CATALOG_MOCK: Trade[] = [
    {
        id: 'plumber',
        name: 'Plomero / Fontanero',
        requiresLicense: false,
    },
    {
        id: 'gas_fitter',
        name: 'Gasista Matriculado',
        requiresLicense: true,
        licenseAuthority: 'Carnet habilitante de Camuzzi Gas del Sur',
    },
    {
        id: 'electrician',
        name: 'Electricista',
        requiresLicense: true,
        licenseAuthority: 'Matrícula habilitante EPEN / CALF',
    },
    {
        id: 'painter',
        name: 'Pintor',
        requiresLicense: false,
    },
];
