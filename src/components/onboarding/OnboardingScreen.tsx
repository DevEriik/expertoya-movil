import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useOnboarding } from '../../hooks/useOnboarding';
import { StepIndicator } from './StepIndicator';
import { DocumentUploadCard } from './DocumentUploadCard';

export const OnboardingScreen: React.FC = () => {
    const {
        state,
        canAdvance,
        tradesCatalog,
        toggleTrade,
        setCuit,
        pickDocument,
        pickDocumentFile,
        removeDocument,
        handleNextStep,
        handlePrevStep,
    } = useOnboarding();

    const handlePrimaryAction = () => {
        if (!canAdvance) return;

        if (state.currentStep === 3) {
            Alert.alert(
                '¡Registro Completado con Éxito!',
                'Tus documentos de identidad, oficios y situación fiscal han sido enviados al equipo de validación de ExpertoYa. En menos de 24 horas tu cuenta estará activa para recibir clientes.',
                [{ text: '¡Entendido!' }]
            );
        } else {
            handleNextStep();
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.topBar}>
                    {state.currentStep > 1 ? (
                        <TouchableOpacity onPress={handlePrevStep} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={22} color="#283593" />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40 }} />
                    )}
                    <Text style={styles.stepText}>Paso {state.currentStep} de 3</Text>
                </View>

                <StepIndicator currentStep={state.currentStep} />

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {state.currentStep === 1 && (
                        <View>
                            <Text style={styles.sectionTitle}>Validación de Identidad</Text>
                            <Text style={styles.sectionSubtitle}>
                                Para garantizar la seguridad de los clientes en ExpertoYa, todos los profesionales deben validar su identidad y antecedentes.
                            </Text>

                            <DocumentUploadCard
                                title="1. DNI Frente"
                                description="Foto nítida del frente del documento."
                                slot={state.identity.dniFront}
                                onPickCamera={() => pickDocument({ target: 'identity', field: 'dniFront' }, 'camera')}
                                onPickGallery={() => pickDocument({ target: 'identity', field: 'dniFront' }, 'gallery')}
                                onRemove={() => removeDocument({ target: 'identity', field: 'dniFront' })}
                            />

                            <DocumentUploadCard
                                title="2. DNI Dorso"
                                description="Foto del reverso donde se lea el código de trámite."
                                slot={state.identity.dniBack}
                                onPickCamera={() => pickDocument({ target: 'identity', field: 'dniBack' }, 'camera')}
                                onPickGallery={() => pickDocument({ target: 'identity', field: 'dniBack' }, 'gallery')}
                                onRemove={() => removeDocument({ target: 'identity', field: 'dniBack' })}
                            />

                            <DocumentUploadCard
                                title="3. Selfie Biométrica"
                                description="Selfie de frente bien iluminada sin anteojos ni gorro."
                                slot={state.identity.biometricSelfie}
                                onPickCamera={() => pickDocument({ target: 'identity', field: 'biometricSelfie' }, 'camera')}
                                onPickGallery={() => pickDocument({ target: 'identity', field: 'biometricSelfie' }, 'gallery')}
                                onRemove={() => removeDocument({ target: 'identity', field: 'biometricSelfie' })}
                            />

                            <DocumentUploadCard
                                title="4. Antecedentes Penales"
                                description="Emisión oficial en PDF con menos de 3 meses de vigencia."
                                slot={state.identity.criminalRecord}
                                mode="file"
                                onPickFile={() => pickDocumentFile({ target: 'identity', field: 'criminalRecord' })}
                                onRemove={() => removeDocument({ target: 'identity', field: 'criminalRecord' })}
                            />

                            <DocumentUploadCard
                                title="5. No Deudor Alimentario"
                                description="Constancia oficial del registro (RDAM) en PDF o imagen."
                                slot={state.identity.foodDebtorsCertificate}
                                mode="file"
                                onPickFile={() => pickDocumentFile({ target: 'identity', field: 'foodDebtorsCertificate' })}
                                onRemove={() => removeDocument({ target: 'identity', field: 'foodDebtorsCertificate' })}
                            />

                        </View>
                    )}

                    {state.currentStep === 2 && (
                        <View>
                            <Text style={styles.sectionTitle}>Oficios y Especialidades</Text>
                            <Text style={styles.sectionSubtitle}>
                                Selecciona los oficios que realizas. Si alguno exige matrícula legal habilitante, te solicitaremos la documentación correspondiente.
                            </Text>

                            <View style={styles.tradesList}>
                                {tradesCatalog.map((trade) => {
                                    const isSelected = state.trades.selectedTradeIds.includes(trade.id);

                                    return (
                                        <TouchableOpacity
                                            key={trade.id}
                                            activeOpacity={0.7}
                                            onPress={() => toggleTrade(trade.id, trade.requiresLicense)}
                                            style={[
                                                styles.tradeCard,
                                                isSelected && styles.tradeCardSelected,
                                            ]}
                                        >
                                            <View style={styles.tradeCardHeader}>
                                                <View
                                                    style={[
                                                        styles.checkbox,
                                                        isSelected && styles.checkboxSelected,
                                                    ]}
                                                >
                                                    {isSelected && (
                                                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                                    )}
                                                </View>

                                                <View style={{ flex: 1, marginLeft: 12 }}>
                                                    <Text
                                                        style={[
                                                            styles.tradeName,
                                                            isSelected && styles.tradeNameSelected,
                                                        ]}
                                                    >
                                                        {trade.name}
                                                    </Text>

                                                    {trade.requiresLicense ? (
                                                        <View style={styles.regulatedBadge}>
                                                            <Ionicons name="shield-checkmark-outline" size={12} color="#EA580C" />
                                                            <Text style={styles.regulatedBadgeText}>Exige Matrícula Oficial</Text>
                                                        </View>
                                                    ) : (
                                                        <Text style={styles.freeBadgeText}>Oficio libre de matrícula</Text>
                                                    )}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            {(() => {
                                const selectedRegulatedTrades = tradesCatalog.filter(
                                    (t) => t.requiresLicense && state.trades.selectedTradeIds.includes(t.id)
                                );

                                if (selectedRegulatedTrades.length === 0 && state.trades.selectedTradeIds.length > 0) {
                                    return (
                                        <View style={styles.noLicensesNotice}>
                                            <Ionicons name="checkmark-circle-outline" size={22} color="#059669" />
                                            <Text style={styles.noLicensesNoticeText}>
                                                Los oficios seleccionados no requieren matrícula habilitante. ¡Puedes continuar al siguiente paso!
                                            </Text>
                                        </View>
                                    );
                                }

                                if (selectedRegulatedTrades.length > 0) {
                                    return (
                                        <View style={styles.licensesContainer}>
                                            <View style={styles.licensesHeader}>
                                                <Ionicons name="warning-outline" size={20} color="#EA580C" />
                                                <Text style={styles.licensesTitle}>Matrículas Obligatorias por Ley</Text>
                                            </View>
                                            <Text style={styles.licensesSubtitle}>
                                                La ley exige verificar tu carnet o matrícula vigente para ejercer estos oficios en la plataforma:
                                            </Text>

                                            {selectedRegulatedTrades.map((trade) => {
                                                const slot = state.trades.licenses[trade.id] ?? {
                                                    uri: null,
                                                    mimeType: null,
                                                    fileSize: null,
                                                    fileName: null,
                                                    status: 'empty',
                                                    errorMessage: null,
                                                };

                                                return (
                                                    <DocumentUploadCard
                                                        key={trade.id}
                                                        title={`Matrícula: ${trade.name}`}
                                                        description={trade.licenseAuthority ?? 'Carnet o certificado habilitante'}
                                                        slot={slot}
                                                        mode="file"
                                                        onPickCamera={() =>
                                                            pickDocument({ target: 'license', tradeId: trade.id }, 'camera')
                                                        }
                                                        onPickGallery={() =>
                                                            pickDocument({ target: 'license', tradeId: trade.id }, 'gallery')
                                                        }
                                                        onPickFile={() =>
                                                            pickDocumentFile({ target: 'license', tradeId: trade.id })
                                                        }
                                                        onRemove={() =>
                                                            removeDocument({ target: 'license', tradeId: trade.id })
                                                        }
                                                    />
                                                );
                                            })}
                                        </View>
                                    );
                                }

                                return null;
                            })()}
                        </View>
                    )}

                    {state.currentStep === 3 && (
                        <View>
                            <Text style={styles.sectionTitle}>Situación Fiscal</Text>
                            <Text style={styles.sectionSubtitle}>
                                ExpertoYa procesa y transfiere los pagos de tus servicios. Para cumplir con la normativa fiscal y evitar retenciones adicionales, completa tus datos:
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Número de CUIT / CUIL</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="card-outline" size={20} color="#283593" style={{ marginRight: 8 }} />
                                    <TextInput
                                        value={state.fiscal.cuit}
                                        onChangeText={setCuit}
                                        placeholder="Ej: 20-12345678-9 (sin guiones)"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="numeric"
                                        maxLength={11}
                                        style={styles.textInput}
                                    />
                                </View>
                                <Text style={styles.inputHelper}>Ingresa los 11 dígitos de tu CUIT/CUIL.</Text>
                            </View>

                            <View style={{ marginTop: 16 }}>
                                <DocumentUploadCard
                                    title="Constancia de Inscripción (AFIP / ARCA)"
                                    description="Comprobante digital en PDF o fotografía de tu constancia de Monotributo."
                                    slot={state.fiscal.afipProof}
                                    mode="file"
                                    onPickCamera={() =>
                                        pickDocument({ target: 'fiscal', field: 'afipProof' }, 'camera')
                                    }
                                    onPickGallery={() =>
                                        pickDocument({ target: 'fiscal', field: 'afipProof' }, 'gallery')
                                    }
                                    onPickFile={() =>
                                        pickDocumentFile({ target: 'fiscal', field: 'afipProof' })
                                    }
                                    onRemove={() =>
                                        removeDocument({ target: 'fiscal', field: 'afipProof' })
                                    }
                                />
                            </View>

                            <View style={styles.securityNotice}>
                                <Ionicons name="lock-closed-outline" size={18} color="#283593" />
                                <Text style={styles.securityNoticeText}>
                                    Tus datos fiscales están protegidos con cifrado y solo serán utilizados para la facturación y transferencias bancarias de tus trabajos.
                                </Text>
                            </View>
                        </View>
                    )}

                </ScrollView>

                <View style={styles.footer}>
                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={handlePrimaryAction}
                            disabled={!canAdvance}
                            activeOpacity={0.8}
                            style={[styles.primaryButton, !canAdvance && styles.primaryButtonDisabled]}
                        >
                            <Text style={[styles.primaryButtonText, !canAdvance && styles.primaryButtonTextDisabled]}>
                                {state.currentStep === 3 ? 'Finalizar Registro' : 'Continuar al siguiente paso'}
                            </Text>
                            <Ionicons
                                name="arrow-forward"
                                size={18}
                                color={canAdvance ? '#FFFFFF' : '#94A3B8'}
                            />
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FDFCF4',
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    backButton: {
        padding: 8,
    },
    stepText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#283593',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 16,
    },
    footer: {
        paddingVertical: 12,
        backgroundColor: '#FDFCF4',
    },
    primaryButton: {
        backgroundColor: '#FF8C00',
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#FF8C00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    primaryButtonDisabled: {
        backgroundColor: '#E2E8F0',
        shadowOpacity: 0,
        elevation: 0,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    primaryButtonTextDisabled: {
        color: '#94A3B8',
    },

    tradesList: {
        gap: 10,
        marginBottom: 20,
    },
    tradeCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        padding: 14,
    },
    tradeCardSelected: {
        borderColor: '#283593',
        backgroundColor: '#EEF2FF',
    },
    tradeCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#94A3B8',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    checkboxSelected: {
        backgroundColor: '#283593',
        borderColor: '#283593',
    },
    tradeName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#334155',
    },
    tradeNameSelected: {
        color: '#283593',
    },
    regulatedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEDD5',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
        gap: 4,
    },
    regulatedBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#EA580C',
    },
    freeBadgeText: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    noLicensesNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        padding: 14,
        borderRadius: 14,
        gap: 10,
        marginTop: 10,
    },
    noLicensesNoticeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#065F46',
        flex: 1,
    },
    licensesContainer: {
        marginTop: 10,
    },
    licensesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    licensesTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#283593',
    },
    licensesSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 14,
    },
    inputGroup: {
        marginTop: 8,
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#283593',
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    inputHelper: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 4,
        marginLeft: 2,
    },
    securityNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
        padding: 12,
        borderRadius: 12,
        gap: 10,
        marginTop: 8,
    },
    securityNoticeText: {
        fontSize: 12,
        color: '#3730A3',
        flex: 1,
        lineHeight: 16,
    },

});
