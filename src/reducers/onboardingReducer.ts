import type { OnboardingState, OnboardingAction, DocumentSlot } from '../types/onboarding';

export const createEmptySlot = (): DocumentSlot => ({
    uri: null,
    mimeType: null,
    fileSize: null,
    fileName: null,
    status: 'empty',
    errorMessage: null,
});

export const initialOnboardingState: OnboardingState = {
    currentStep: 1,
    identity: {
        dniFront: createEmptySlot(),
        dniBack: createEmptySlot(),
        biometricSelfie: createEmptySlot(),
        criminalRecord: createEmptySlot(),
        foodDebtorsCertificate: createEmptySlot(),
    },
    trades: {
        selectedTradeIds: [],
        licenses: {},
    },
    fiscal: {
        cuit: '',
        afipProof: createEmptySlot(),
    },
};

export const onboardingReducer = (
    state: OnboardingState,
    action: OnboardingAction
): OnboardingState => {
    switch (action.type) {
        case 'TOGGLE_TRADE': {
            const { tradeId, requiresLicense } = action.payload;
            const isAlreadySelected = state.trades.selectedTradeIds.includes(tradeId);

            if (isAlreadySelected) {
                const updatedTradeIds = state.trades.selectedTradeIds.filter((id) => id !== tradeId);
                const { [tradeId]: _, ...remainingLicenses } = state.trades.licenses;

                return {
                    ...state,
                    trades: {
                        selectedTradeIds: updatedTradeIds,
                        licenses: remainingLicenses,
                    },
                };
            } else {
                const updatedTradeIds = [...state.trades.selectedTradeIds, tradeId];
                const updatedLicenses = { ...state.trades.licenses };

                if (requiresLicense) {
                    updatedLicenses[tradeId] = createEmptySlot();
                }

                return {
                    ...state,
                    trades: {
                        selectedTradeIds: updatedTradeIds,
                        licenses: updatedLicenses,
                    },
                };
            }
        }

        case 'SET_DOCUMENT': {
            const { target } = action.payload;

            if (target === 'identity') {
                return {
                    ...state,
                    identity: {
                        ...state.identity,
                        [action.payload.field]: action.payload.slot,
                    },
                };
            }

            if (target === 'fiscal') {
                return {
                    ...state,
                    fiscal: {
                        ...state.fiscal,
                        afipProof: action.payload.slot,
                    },
                };
            }

            if (target === 'license') {
                return {
                    ...state,
                    trades: {
                        ...state.trades,
                        licenses: {
                            ...state.trades.licenses,
                            [action.payload.tradeId]: action.payload.slot,
                        },
                    },
                };
            }

            return state;
        }

        case 'REMOVE_DOCUMENT': {
            const { target } = action.payload;

            if (target === 'identity') {
                return {
                    ...state,
                    identity: {
                        ...state.identity,
                        [action.payload.field]: createEmptySlot(),
                    },
                };
            }

            if (target === 'fiscal') {
                return {
                    ...state,
                    fiscal: {
                        ...state.fiscal,
                        afipProof: createEmptySlot(),
                    },
                };
            }

            if (target === 'license') {
                return {
                    ...state,
                    trades: {
                        ...state.trades,
                        licenses: {
                            ...state.trades.licenses,
                            [action.payload.tradeId]: createEmptySlot(),
                        },
                    },
                };
            }

            return state;
        }

        case 'SET_STEP': {
            return {
                ...state,
                currentStep: action.payload,
            };
        }

        case 'SET_CUIT': {
            return {
                ...state,
                fiscal: {
                    ...state.fiscal,
                    cuit: action.payload,
                },
            };
        }

        default:
            return state;

    }
};
