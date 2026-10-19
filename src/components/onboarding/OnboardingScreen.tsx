import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useOnboarding } from "../../hooks/useOnboarding";
import { getToken } from "../../utils/secureStore";
import { API_URL } from "../../utils/api";
import { DocumentUploadCard } from "./DocumentUploadCard";
import { StepIndicator } from "./StepIndicator";

export const OnboardingScreen: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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

  const handlePrimaryAction = async () => {
    if (!canAdvance || isSubmitting) return;

    if (state.currentStep === 3) {
      setIsSubmitting(true);
      try {
        const token = await getToken("auth_token");

        const uploadFormData = await new Promise<Response>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `${API_URL}/api/professionals/onboarding`);

          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }

          xhr.onload = () => {
            resolve(
              new Response(xhr.responseText, {
                status: xhr.status,
                headers: { "Content-Type": "application/json" },
              }),
            );
          };
          xhr.onerror = () => reject(new Error("Error de red"));
          xhr.ontimeout = () => reject(new Error("Timeout de red"));

          const formData = new FormData();
          formData.append("cuit", String(state.fiscal.cuit || ""));
          formData.append("oficios_ids", JSON.stringify(state.trades.selectedTradeIds));

          const appendFile = (key: string, slot: any) => {
            if (slot && slot.uri) {
              const isPdf =
                slot.fileName?.toLowerCase().endsWith(".pdf") ||
                slot.mimeType === "application/pdf";
              const ext = isPdf ? "pdf" : "jpg";
              const mime = isPdf ? "application/pdf" : slot.mimeType || "image/jpeg";
              const fileName = slot.fileName || `${key}.${ext}`;

              (formData as any).append(key, {
                uri: slot.uri,
                name: fileName,
                type: mime,
              });
            }
          };

          appendFile("dni_frente", state.identity.dniFront);
          appendFile("dni_dorso", state.identity.dniBack);
          appendFile("selfie_biometrica", state.identity.biometricSelfie);
          appendFile("antecedentes_penales", state.identity.criminalRecord);
          appendFile("certificado_no_deudor", state.identity.foodDebtorsCertificate);
          appendFile("constancia_afip", state.fiscal.afipProof);

          const licenciasSubidas = Object.values(state.trades.licenses).filter(
            (slot: any) => slot && slot.uri,
          );
          for (const licencia of licenciasSubidas) {
            appendFile("matricula_documento", licencia);
          }

          xhr.send(formData);
        });

        const response = uploadFormData;
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.detalle || data.error || "Error al procesar onboarding",
          );
        }

        Alert.alert(
          "¡Registro Completado con Éxito!",
          "Tus documentos de identidad, oficios y situación fiscal han sido enviados al equipo de validación de ExpertoYa. En menos de 24 horas tu cuenta estará activa para recibir clientes.",
          [
            {
              text: "¡Entendido!",
              onPress: () => router.replace("/account-details"),
            },
          ],
        );
      } catch (error: any) {
        console.error("Error al enviar onboarding:", error);
        Alert.alert(
          "Error",
          error.message || "Ocurrió un problema enviando tus documentos.",
        );
      } finally {
        setIsSubmitting(false);
      }
    } else {
      handleNextStep();
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-[#FDFCF4] dark:bg-[#121826]"
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? "#121826" : "#FDFCF4" },
      ]}
    >
      <View
        className="flex-1 px-4 bg-[#FDFCF4] dark:bg-[#121826]"
        style={[
          styles.container,
          { backgroundColor: isDark ? "#121826" : "#FDFCF4" },
        ]}
      >
        <View className="flex-row items-center justify-between py-2" style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              if (state.currentStep > 1) {
                handlePrevStep();
              } else {
                router.back();
              }
            }}
            className="p-2 -ml-2 rounded-full active:opacity-70"
            style={styles.backButton}
            accessibilityLabel="Volver"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={isDark ? "#FFB74D" : "#283593"}
            />
          </TouchableOpacity>

          <Text
            className="text-xs font-bold text-[#94A3B8] dark:text-[#94A3B8]"
            style={[styles.stepText, { color: isDark ? "#94A3B8" : "#94A3B8" }]}
          >
            Paso {state.currentStep} de 3
          </Text>
        </View>

        <StepIndicator currentStep={state.currentStep} />

        <ScrollView
          className="flex-1"
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {state.currentStep === 1 && (
            <View>
              <Text
                className="text-xl font-extrabold text-[#283593] dark:text-[#FDFCF4] mb-1"
                style={[
                  styles.sectionTitle,
                  { color: isDark ? "#FDFCF4" : "#283593" },
                ]}
              >
                Validación de Identidad
              </Text>
              <Text
                className="text-[13px] text-[#64748B] dark:text-[#94A3B8] leading-[18px] mb-4"
                style={[
                  styles.sectionSubtitle,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                Para garantizar la seguridad de los clientes en ExpertoYa, todos
                los profesionales deben validar su identidad y antecedentes.
              </Text>

              <DocumentUploadCard
                title="1. DNI Frente"
                description="Foto nítida del frente del documento."
                slot={state.identity.dniFront}
                onPickCamera={() =>
                  pickDocument(
                    { target: "identity", field: "dniFront" },
                    "camera",
                  )
                }
                onPickGallery={() =>
                  pickDocument(
                    { target: "identity", field: "dniFront" },
                    "gallery",
                  )
                }
                onRemove={() =>
                  removeDocument({ target: "identity", field: "dniFront" })
                }
              />

              <DocumentUploadCard
                title="2. DNI Dorso"
                description="Foto del reverso donde se lea el código de trámite."
                slot={state.identity.dniBack}
                onPickCamera={() =>
                  pickDocument(
                    { target: "identity", field: "dniBack" },
                    "camera",
                  )
                }
                onPickGallery={() =>
                  pickDocument(
                    { target: "identity", field: "dniBack" },
                    "gallery",
                  )
                }
                onRemove={() =>
                  removeDocument({ target: "identity", field: "dniBack" })
                }
              />

              <DocumentUploadCard
                title="3. Selfie Biométrica"
                description="Selfie de frente bien iluminada sin anteojos ni gorro."
                slot={state.identity.biometricSelfie}
                onPickCamera={() =>
                  pickDocument(
                    { target: "identity", field: "biometricSelfie" },
                    "camera",
                  )
                }
                onPickGallery={() =>
                  pickDocument(
                    { target: "identity", field: "biometricSelfie" },
                    "gallery",
                  )
                }
                onRemove={() =>
                  removeDocument({
                    target: "identity",
                    field: "biometricSelfie",
                  })
                }
              />

              <DocumentUploadCard
                title="4. Antecedentes Penales"
                description="Emisión oficial en PDF con menos de 3 meses de vigencia."
                slot={state.identity.criminalRecord}
                mode="file"
                onPickFile={() =>
                  pickDocumentFile({
                    target: "identity",
                    field: "criminalRecord",
                  })
                }
                onRemove={() =>
                  removeDocument({
                    target: "identity",
                    field: "criminalRecord",
                  })
                }
              />

              <DocumentUploadCard
                title="5. No Deudor Alimentario"
                description="Constancia oficial del registro (RDAM) en PDF o imagen."
                slot={state.identity.foodDebtorsCertificate}
                mode="file"
                onPickFile={() =>
                  pickDocumentFile({
                    target: "identity",
                    field: "foodDebtorsCertificate",
                  })
                }
                onRemove={() =>
                  removeDocument({
                    target: "identity",
                    field: "foodDebtorsCertificate",
                  })
                }
              />
            </View>
          )}

          {state.currentStep === 2 && (
            <View>
              <Text
                className="text-xl font-extrabold text-[#283593] dark:text-[#FDFCF4] mb-1"
                style={[
                  styles.sectionTitle,
                  { color: isDark ? "#FDFCF4" : "#283593" },
                ]}
              >
                Oficios y Especialidades
              </Text>
              <Text
                className="text-[13px] text-[#64748B] dark:text-[#94A3B8] leading-[18px] mb-4"
                style={[
                  styles.sectionSubtitle,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                Selecciona los oficios que realizas. Si alguno exige matrícula
                legal habilitante, te solicitaremos la documentación
                correspondiente.
              </Text>

              <View className="gap-2.5 mb-5" style={styles.tradesList}>
                {tradesCatalog.map((trade) => {
                  const isSelected = state.trades.selectedTradeIds.includes(
                    trade.id,
                  );

                  return (
                    <TouchableOpacity
                      key={trade.id}
                      activeOpacity={0.7}
                      onPress={() =>
                        toggleTrade(trade.id, trade.requiresLicense)
                      }
                      className={`border-[1.5px] rounded-[14px] p-3.5 mb-2.5 ${isSelected
                          ? "bg-[#EEF2FF] dark:bg-[#1E293B] border-[#283593] dark:border-[#33EFA5]"
                          : "bg-white dark:bg-[#1F2937] border-[#E2E8F0] dark:border-[#374151]"
                        }`}
                      style={[
                        styles.tradeCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? "#1E293B"
                              : "#EEF2FF"
                            : isDark
                              ? "#1F2937"
                              : "#FFFFFF",
                          borderColor: isSelected
                            ? isDark
                              ? "#33EFA5"
                              : "#283593"
                            : isDark
                              ? "#374151"
                              : "#E2E8F0",
                        },
                      ]}
                    >
                      <View className="flex-row items-center" style={styles.tradeCardHeader}>
                        <View
                          className={`w-[22px] h-[22px] rounded-md border-2 items-center justify-center ${isSelected
                              ? "bg-[#283593] dark:bg-[#33EFA5] border-[#283593] dark:border-[#33EFA5]"
                              : "bg-white dark:bg-[#1F2937] border-[#94A3B8] dark:border-[#6B7280]"
                            }`}
                          style={[
                            styles.checkbox,
                            {
                              backgroundColor: isSelected
                                ? isDark
                                  ? "#33EFA5"
                                  : "#283593"
                                : isDark
                                  ? "#1F2937"
                                  : "#FFFFFF",
                              borderColor: isSelected
                                ? isDark
                                  ? "#33EFA5"
                                  : "#283593"
                                : isDark
                                  ? "#6B7280"
                                  : "#94A3B8",
                            },
                          ]}
                        >
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color={isDark ? "#121826" : "#FFFFFF"}
                            />
                          )}
                        </View>

                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text
                            className={`text-[15px] font-bold ${isSelected
                                ? "text-[#283593] dark:text-[#33EFA5]"
                                : "text-[#334155] dark:text-[#F3F4F6]"
                              }`}
                            style={[
                              styles.tradeName,
                              {
                                color: isSelected
                                  ? isDark
                                    ? "#33EFA5"
                                    : "#283593"
                                  : isDark
                                    ? "#F3F4F6"
                                    : "#334155",
                              },
                            ]}
                          >
                            {trade.name}
                          </Text>

                          {trade.requiresLicense ? (
                            <View
                              className="flex-row items-center bg-[#FFEDD5] dark:bg-[#451A03] py-0.5 px-2 rounded-lg self-start mt-1 gap-1"
                              style={[
                                styles.regulatedBadge,
                                {
                                  backgroundColor: isDark
                                    ? "#451A03"
                                    : "#FFEDD5",
                                },
                              ]}
                            >
                              <Ionicons
                                name="shield-checkmark-outline"
                                size={12}
                                color={isDark ? "#FFB74D" : "#EA580C"}
                              />
                              <Text
                                className="text-[11px] font-bold text-[#EA580C] dark:text-[#FFB74D]"
                                style={[
                                  styles.regulatedBadgeText,
                                  {
                                    color: isDark ? "#FFB74D" : "#EA580C",
                                  },
                                ]}
                              >
                                Exige Matrícula Oficial
                              </Text>
                            </View>
                          ) : (
                            <Text
                              className="text-[11px] text-[#94A3B8] dark:text-[#94A3B8] mt-0.5"
                              style={[
                                styles.freeBadgeText,
                                { color: isDark ? "#94A3B8" : "#94A3B8" },
                              ]}
                            >
                              Oficio libre de matrícula
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {(() => {
                const selectedRegulatedTrades = tradesCatalog.filter(
                  (t) =>
                    t.requiresLicense &&
                    state.trades.selectedTradeIds.includes(t.id),
                );

                if (
                  selectedRegulatedTrades.length === 0 &&
                  state.trades.selectedTradeIds.length > 0
                ) {
                  return (
                    <View
                      className="flex-row items-center bg-[#D1FAE5] dark:bg-[#064E3B]/60 border border-[#A7F3D0] dark:border-[#047857] p-3.5 rounded-[14px] gap-2.5 mt-2.5"
                      style={[
                        styles.noLicensesNotice,
                        {
                          backgroundColor: isDark
                            ? "rgba(6, 78, 59, 0.5)"
                            : "#D1FAE5",
                          borderColor: isDark ? "#047857" : "#A7F3D0",
                        },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={22}
                        color={isDark ? "#33EFA5" : "#059669"}
                      />
                      <Text
                        className="text-[13px] font-semibold text-[#065F46] dark:text-[#33EFA5] flex-1"
                        style={[
                          styles.noLicensesNoticeText,
                          { color: isDark ? "#33EFA5" : "#065F46" },
                        ]}
                      >
                        Los oficios seleccionados no requieren matrícula
                        habilitante. ¡Puedes continuar al siguiente paso!
                      </Text>
                    </View>
                  );
                }

                if (selectedRegulatedTrades.length > 0) {
                  return (
                    <View className="mt-2.5" style={styles.licensesContainer}>
                      <View className="flex-row items-center gap-2 mb-1" style={styles.licensesHeader}>
                        <Ionicons
                          name="warning-outline"
                          size={20}
                          color={isDark ? "#FFB74D" : "#EA580C"}
                        />
                        <Text
                          className="text-base font-extrabold text-[#283593] dark:text-[#FDFCF4]"
                          style={[
                            styles.licensesTitle,
                            { color: isDark ? "#FDFCF4" : "#283593" },
                          ]}
                        >
                          Matrículas Obligatorias por Ley
                        </Text>
                      </View>
                      <Text
                        className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-3.5"
                        style={[
                          styles.licensesSubtitle,
                          { color: isDark ? "#94A3B8" : "#64748B" },
                        ]}
                      >
                        La ley exige verificar tu carnet o matrícula vigente
                        para ejercer estos oficios en la plataforma:
                      </Text>

                      {selectedRegulatedTrades.map((trade) => {
                        const slot = state.trades.licenses[trade.id] ?? {
                          uri: null,
                          mimeType: null,
                          fileSize: null,
                          fileName: null,
                          status: "empty",
                          errorMessage: null,
                        };

                        return (
                          <DocumentUploadCard
                            key={trade.id}
                            title={`Matrícula: ${trade.name}`}
                            description={
                              trade.licenseAuthority ??
                              "Carnet o certificado habilitante"
                            }
                            slot={slot}
                            mode="file"
                            onPickCamera={() =>
                              pickDocument(
                                { target: "license", tradeId: trade.id },
                                "camera",
                              )
                            }
                            onPickGallery={() =>
                              pickDocument(
                                { target: "license", tradeId: trade.id },
                                "gallery",
                              )
                            }
                            onPickFile={() =>
                              pickDocumentFile({
                                target: "license",
                                tradeId: trade.id,
                              })
                            }
                            onRemove={() =>
                              removeDocument({
                                target: "license",
                                tradeId: trade.id,
                              })
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
              <Text
                className="text-xl font-extrabold text-[#283593] dark:text-[#FDFCF4] mb-1"
                style={[
                  styles.sectionTitle,
                  { color: isDark ? "#FDFCF4" : "#283593" },
                ]}
              >
                Situación Fiscal
              </Text>
              <Text
                className="text-[13px] text-[#64748B] dark:text-[#94A3B8] leading-[18px] mb-4"
                style={[
                  styles.sectionSubtitle,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                ExpertoYa procesa y transfiere los pagos de tus servicios. Para
                cumplir con la normativa fiscal y evitar retenciones
                adicionales, completa tus datos:
              </Text>

              <View className="mt-2 mb-3" style={styles.inputGroup}>
                <Text
                  className="text-sm font-bold text-[#283593] dark:text-[#FDFCF4] mb-1.5"
                  style={[
                    styles.inputLabel,
                    { color: isDark ? "#FDFCF4" : "#283593" },
                  ]}
                >
                  Número de CUIT / CUIL
                </Text>
                <View
                  className="flex-row items-center bg-white dark:bg-[#1F2937] border-[1.5px] border-[#CBD5E1] dark:border-[#374151] rounded-[14px] px-3.5 py-3"
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                      borderColor: isDark ? "#374151" : "#CBD5E1",
                    },
                  ]}
                >
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={isDark ? "#33EFA5" : "#283593"}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    value={state.fiscal.cuit}
                    onChangeText={setCuit}
                    placeholder="Ej: 20-12345678-9 (sin guiones)"
                    placeholderTextColor={isDark ? "#6B7280" : "#94A3B8"}
                    keyboardType="numeric"
                    maxLength={11}
                    className="flex-1 text-[15px] font-semibold text-[#1E293B] dark:text-[#F9FAFB]"
                    style={[
                      styles.textInput,
                      { color: isDark ? "#F9FAFB" : "#1E293B" },
                    ]}
                  />
                </View>
                <Text
                  className="text-[11px] text-[#94A3B8] dark:text-[#94A3B8] mt-1 ml-0.5"
                  style={[styles.inputHelper, { color: isDark ? "#94A3B8" : "#94A3B8" }]}
                >
                  Ingresa los 11 dígitos de tu CUIT/CUIL.
                </Text>
              </View>

              <View style={{ marginTop: 16 }}>
                <DocumentUploadCard
                  title="Constancia de Inscripción (AFIP / ARCA)"
                  description="Comprobante digital en PDF o fotografía de tu constancia de Monotributo."
                  slot={state.fiscal.afipProof}
                  mode="file"
                  onPickCamera={() =>
                    pickDocument(
                      { target: "fiscal", field: "afipProof" },
                      "camera",
                    )
                  }
                  onPickGallery={() =>
                    pickDocument(
                      { target: "fiscal", field: "afipProof" },
                      "gallery",
                    )
                  }
                  onPickFile={() =>
                    pickDocumentFile({ target: "fiscal", field: "afipProof" })
                  }
                  onRemove={() =>
                    removeDocument({ target: "fiscal", field: "afipProof" })
                  }
                />
              </View>

              <View
                className="flex-row items-center bg-[#EEF2FF] dark:bg-[#1F2937] border border-[#C7D2FE] dark:border-[#374151] p-3 rounded-xl gap-2.5 mt-2"
                style={[
                  styles.securityNotice,
                  {
                    backgroundColor: isDark ? "#1F2937" : "#EEF2FF",
                    borderColor: isDark ? "#374151" : "#C7D2FE",
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={isDark ? "#33EFA5" : "#283593"}
                />
                <Text
                  className="text-xs text-[#3730A3] dark:text-[#94A3B8] flex-1 leading-4"
                  style={[
                    styles.securityNoticeText,
                    { color: isDark ? "#94A3B8" : "#3730A3" },
                  ]}
                >
                  Tus datos fiscales están protegidos con cifrado y solo serán
                  utilizados para la facturación y transferencias bancarias de
                  tus trabajos.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer y Botón de Acción Principal */}
        <View
          className="py-3 bg-[#FDFCF4] dark:bg-[#121826]"
          style={[
            styles.footer,
            { backgroundColor: isDark ? "#121826" : "#FDFCF4" },
          ]}
        >
          <TouchableOpacity
            onPress={handlePrimaryAction}
            disabled={!canAdvance || isSubmitting}
            activeOpacity={0.8}
            className={`py-4 rounded-2xl flex-row items-center justify-center gap-2 ${!canAdvance || isSubmitting
                ? "bg-[#E2E8F0] dark:bg-[#374151]"
                : "bg-[#FF8C00] dark:bg-[#FFB74D] shadow-md shadow-[#FF8C00]/30 dark:shadow-none"
              }`}
            style={[
              styles.primaryButton,
              (!canAdvance || isSubmitting) && styles.primaryButtonDisabled,
              {
                backgroundColor:
                  !canAdvance || isSubmitting
                    ? isDark
                      ? "#374151"
                      : "#E2E8F0"
                    : isDark
                      ? "#FFB74D"
                      : "#FF8C00",
                shadowColor: isDark ? "#FFB74D" : "#FF8C00",
              },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator
                color={isDark && canAdvance ? "#121826" : "#FFFFFF"}
                size="small"
              />
            ) : (
              <>
                <Text
                  className={`text-[15px] font-bold ${!canAdvance
                      ? "text-[#94A3B8] dark:text-[#6B7280]"
                      : "text-white dark:text-[#121826]"
                    }`}
                  style={[
                    styles.primaryButtonText,
                    {
                      color: !canAdvance
                        ? isDark
                          ? "#6B7280"
                          : "#94A3B8"
                        : isDark
                          ? "#121826"
                          : "#FFFFFF",
                    },
                  ]}
                >
                  {state.currentStep === 3
                    ? "Finalizar Registro"
                    : "Continuar al siguiente paso"}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={
                    canAdvance
                      ? isDark
                        ? "#121826"
                        : "#FFFFFF"
                      : isDark
                        ? "#6B7280"
                        : "#94A3B8"
                  }
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  stepText: {
    fontSize: 12,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  footer: {
    paddingVertical: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  tradesList: {
    gap: 10,
    marginBottom: 20,
  },
  tradeCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
  },
  tradeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tradeName: {
    fontSize: 15,
    fontWeight: "700",
  },
  regulatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
    gap: 4,
  },
  regulatedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  freeBadgeText: {
    fontSize: 11,
    marginTop: 2,
  },
  noLicensesNotice: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 14,
    borderRadius: 14,
    gap: 10,
    marginTop: 10,
  },
  noLicensesNoticeText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  licensesContainer: {
    marginTop: 10,
  },
  licensesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  licensesTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  licensesSubtitle: {
    fontSize: 12,
    marginBottom: 14,
  },
  inputGroup: {
    marginTop: 8,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  inputHelper: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginTop: 8,
  },
  securityNoticeText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
