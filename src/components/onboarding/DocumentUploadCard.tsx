import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/context/AccessibilityContext';
import type { DocumentSlot } from '../../types/onboarding';

interface DocumentUploadCardProps {
    title: string;
    description: string;
    slot: DocumentSlot;
    mode?: 'image' | 'file';
    onPickCamera?: () => void;
    onPickGallery?: () => void;
    onPickFile?: () => void;
    onRemove: () => void;
}

export const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
    title,
    description,
    slot,
    mode = 'image',
    onPickCamera,
    onPickGallery,
    onPickFile,
    onRemove,
}) => {
    const { isDarkMode: isDark } = useAccessibility();
    const isSuccess = slot.status === 'valid';
    const isError = slot.status === 'invalid';
    const isPdf = slot.fileName?.toLowerCase().endsWith('.pdf') || slot.mimeType === 'application/pdf';

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    borderColor: isDark ? '#374151' : '#E2E8F0',
                },
                isSuccess && (isDark ? styles.cardSuccessDark : styles.cardSuccess),
                isError && (isDark ? styles.cardErrorDark : styles.cardError),
            ]}
        >
            <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                        <Text
                            style={[
                                styles.title,
                                { color: isDark ? '#FDFCF4' : '#283593' },
                            ]}
                        >
                            {title}
                        </Text>
                        {isSuccess && (
                            <View
                                style={[
                                    styles.badgeSuccess,
                                    isDark && { backgroundColor: '#064E3B' },
                                ]}
                            >
                                <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color={isDark ? '#33EFA5' : '#059669'}
                                />
                                <Text
                                    style={[
                                        styles.badgeSuccessText,
                                        isDark && { color: '#33EFA5' },
                                    ]}
                                >
                                    Cargado
                                </Text>
                            </View>
                        )}
                        {isError && (
                            <View
                                style={[
                                    styles.badgeError,
                                    isDark && { backgroundColor: '#450A0A' },
                                ]}
                            >
                                <Ionicons name="alert-circle" size={14} color="#DC2626" />
                                <Text style={styles.badgeErrorText}>Error</Text>
                            </View>
                        )}
                    </View>
                    <Text
                        style={[
                            styles.description,
                            { color: isDark ? '#94A3B8' : '#64748B' },
                        ]}
                    >
                        {description}
                    </Text>
                </View>
            </View>

            {isError && slot.errorMessage && (
                <View
                    style={[
                        styles.errorAlert,
                        isDark && { backgroundColor: '#450A0A', borderColor: '#7F1D1D' },
                    ]}
                >
                    <Ionicons name="warning-outline" size={16} color="#DC2626" />
                    <Text
                        style={[
                            styles.errorAlertText,
                            isDark && { color: '#FCA5A5' },
                        ]}
                    >
                        {slot.errorMessage}
                    </Text>
                </View>
            )}
            <View style={styles.actionsContainer}>
                {slot.uri ? (
                    <View
                        style={[
                            styles.previewContainer,
                            {
                                backgroundColor: isDark ? '#111827' : '#F8FAFC',
                                borderColor: isDark ? '#374151' : '#E2E8F0',
                            },
                        ]}
                    >
                        {isPdf ? (
                            <View
                                style={[
                                    styles.pdfThumbnail,
                                    isDark && { backgroundColor: '#450A0A' },
                                ]}
                            >
                                <Ionicons name="document-text" size={26} color="#DC2626" />
                            </View>
                        ) : (
                            <Image source={{ uri: slot.uri }} style={styles.thumbnail} />
                        )}
                        <View style={styles.fileInfo}>
                            <Text
                                numberOfLines={1}
                                style={[
                                    styles.fileName,
                                    { color: isDark ? '#F3F4F6' : '#334155' },
                                ]}
                            >
                                {slot.fileName}
                            </Text>
                            {slot.fileSize && (
                                <Text
                                    style={[
                                        styles.fileSize,
                                        { color: isDark ? '#9CA3AF' : '#94A3B8' },
                                    ]}
                                >
                                    {(slot.fileSize / (1024 * 1024)).toFixed(2)} MB
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            onPress={onRemove}
                            accessibilityLabel={`Eliminar ${title}`}
                            style={styles.deleteButton}
                        >
                            <Ionicons name="trash-outline" size={20} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                ) : mode === 'file' ? (
                    <TouchableOpacity
                        onPress={onPickFile}
                        activeOpacity={0.7}
                        style={[
                            styles.actionButtonFull,
                            {
                                backgroundColor: isDark ? '#111827' : '#F8FAFC',
                                borderColor: isDark ? '#374151' : '#CBD5E1',
                            },
                        ]}
                    >
                        <Ionicons
                            name="document-attach-outline"
                            size={20}
                            color={isDark ? '#FFB74D' : '#FF8C00'}
                        />
                        <Text
                            style={[
                                styles.actionButtonText,
                                { color: isDark ? '#FFB74D' : '#283593' },
                            ]}
                        >
                            Seleccionar Archivo o PDF
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.buttonsRow}>
                        <TouchableOpacity
                            onPress={onPickCamera}
                            activeOpacity={0.7}
                            style={[
                                styles.actionButton,
                                {
                                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                                    borderColor: isDark ? '#374151' : '#CBD5E1',
                                },
                            ]}
                        >
                            <Ionicons
                                name="camera-outline"
                                size={18}
                                color={isDark ? '#FFB74D' : '#FF8C00'}
                            />
                            <Text
                                style={[
                                    styles.actionButtonText,
                                    { color: isDark ? '#FFB74D' : '#283593' },
                                ]}
                            >
                                Tomar Foto
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onPickGallery}
                            activeOpacity={0.7}
                            style={[
                                styles.actionButton,
                                {
                                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                                    borderColor: isDark ? '#374151' : '#CBD5E1',
                                },
                            ]}
                        >
                            <Ionicons
                                name="image-outline"
                                size={18}
                                color={isDark ? '#FFB74D' : '#FF8C00'}
                            />
                            <Text
                                style={[
                                    styles.actionButtonText,
                                    { color: isDark ? '#FFB74D' : '#283593' },
                                ]}
                            >
                                Galería
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        marginBottom: 14,
    },
    cardSuccess: {
        borderColor: '#10B981',
        borderStyle: 'solid',
        backgroundColor: '#F0FDF4',
    },
    cardSuccessDark: {
        borderColor: '#059669',
        borderStyle: 'solid',
        backgroundColor: '#064E3B',
    },
    cardError: {
        borderColor: '#EF4444',
        borderStyle: 'solid',
        backgroundColor: '#FEF2F2',
    },
    cardErrorDark: {
        borderColor: '#DC2626',
        borderStyle: 'solid',
        backgroundColor: '#450A0A',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
    },
    description: {
        fontSize: 12,
        marginTop: 4,
    },
    badgeSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 12,
        gap: 4,
    },
    badgeSuccessText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#059669',
    },
    badgeError: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 12,
        gap: 4,
    },
    badgeErrorText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#DC2626',
    },
    errorAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FCA5A5',
        padding: 8,
        borderRadius: 10,
        marginTop: 10,
        gap: 6,
    },
    errorAlertText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#B91C1C',
        flex: 1,
    },
    actionsContainer: {
        marginTop: 12,
    },
    previewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        padding: 8,
    },
    thumbnail: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#374151',
    },
    fileInfo: {
        flex: 1,
        marginLeft: 12,
    },
    fileName: {
        fontSize: 13,
        fontWeight: '600',
    },
    fileSize: {
        fontSize: 11,
        marginTop: 2,
    },
    deleteButton: {
        padding: 8,
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 12,
        gap: 6,
        minHeight: 46,
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    actionButtonFull: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 14,
        gap: 8,
        minHeight: 48,
    },
    pdfThumbnail: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
