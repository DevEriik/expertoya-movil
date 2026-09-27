import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    const isSuccess = slot.status === 'valid';
    const isError = slot.status === 'invalid';
    const isPdf = slot.fileName?.toLowerCase().endsWith('.pdf') || slot.mimeType === 'application/pdf';

    return (
        <View
            style={[
                styles.card,
                isSuccess && styles.cardSuccess,
                isError && styles.cardError,
            ]}
        >
            <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{title}</Text>
                        {isSuccess && (
                            <View style={styles.badgeSuccess}>
                                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                                <Text style={styles.badgeSuccessText}>Cargado</Text>
                            </View>
                        )}
                        {isError && (
                            <View style={styles.badgeError}>
                                <Ionicons name="alert-circle" size={14} color="#DC2626" />
                                <Text style={styles.badgeErrorText}>Error</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.description}>{description}</Text>
                </View>
            </View>

            {isError && slot.errorMessage && (
                <View style={styles.errorAlert}>
                    <Ionicons name="warning-outline" size={16} color="#DC2626" />
                    <Text style={styles.errorAlertText}>{slot.errorMessage}</Text>
                </View>
            )}
            <View style={styles.actionsContainer}>
                {slot.uri ? (
                    <View style={styles.previewContainer}>
                        {isPdf ? (
                            <View style={styles.pdfThumbnail}>
                                <Ionicons name="document-text" size={26} color="#DC2626" />
                            </View>
                        ) : (
                            <Image source={{ uri: slot.uri }} style={styles.thumbnail} />
                        )}
                        <View style={styles.fileInfo}>
                            <Text numberOfLines={1} style={styles.fileName}>
                                {slot.fileName}
                            </Text>
                            {slot.fileSize && (
                                <Text style={styles.fileSize}>
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
                        style={styles.actionButtonFull}
                    >
                        <Ionicons name="document-attach-outline" size={20} color="#FF8C00" />
                        <Text style={styles.actionButtonText}>Seleccionar Archivo o PDF</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.buttonsRow}>
                        <TouchableOpacity
                            onPress={onPickCamera}
                            activeOpacity={0.7}
                            style={styles.actionButton}
                        >
                            <Ionicons name="camera-outline" size={18} color="#FF8C00" />
                            <Text style={styles.actionButtonText}>Tomar Foto</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onPickGallery}
                            activeOpacity={0.7}
                            style={styles.actionButton}
                        >
                            <Ionicons name="image-outline" size={18} color="#FF8C00" />
                            <Text style={styles.actionButtonText}>Galería</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        marginBottom: 14,
    },
    cardSuccess: {
        borderColor: '#10B981',
        borderStyle: 'solid',
        backgroundColor: '#F0FDF4',
    },
    cardError: {
        borderColor: '#EF4444',
        borderStyle: 'solid',
        backgroundColor: '#FEF2F2',
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
        color: '#283593',
    },
    description: {
        fontSize: 12,
        color: '#64748B',
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
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 8,
    },
    thumbnail: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#E2E8F0',
    },
    fileInfo: {
        flex: 1,
        marginLeft: 12,
    },
    fileName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    fileSize: {
        fontSize: 11,
        color: '#94A3B8',
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
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        paddingVertical: 12,
        gap: 6,
        minHeight: 46,
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#283593',
    },

    actionButtonFull: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
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
