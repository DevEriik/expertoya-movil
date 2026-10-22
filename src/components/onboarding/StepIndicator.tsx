import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/context/AccessibilityContext';

interface StepIndicatorProps {
    currentStep: number;
}

const STEPS = [
    { step: 1, label: 'Identidad' },
    { step: 2, label: 'Oficios' },
    { step: 3, label: 'Fiscal' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
    const { isDarkMode: isDark } = useAccessibility();

    return (
        <View style={styles.container}>
            <View
                style={[
                    styles.backgroundLine,
                    { backgroundColor: isDark ? '#374151' : '#E2E8F0' },
                ]}
            />
            <View
                style={[
                    styles.activeLine,
                    {
                        width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                        backgroundColor: isDark ? '#FFB74D' : '#FF8C00',
                    },
                ]}
            />

            {STEPS.map((s) => {
                const isCompleted = currentStep > s.step;
                const isActive = currentStep === s.step;

                return (
                    <View key={s.step} style={styles.stepItem}>
                        <View
                            style={[
                                styles.stepCircle,
                                {
                                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                                    borderColor: isDark ? '#4B5563' : '#CBD5E1',
                                },
                                isCompleted && {
                                    backgroundColor: isDark ? '#33EFA5' : '#283593',
                                    borderColor: isDark ? '#33EFA5' : '#283593',
                                },
                                isActive && {
                                    backgroundColor: isDark ? '#FFB74D' : '#FF8C00',
                                    borderColor: isDark ? '#FFB74D' : '#FF8C00',
                                },
                            ]}
                        >
                            {isCompleted ? (
                                <Ionicons
                                    name="checkmark"
                                    size={16}
                                    color={isDark ? '#121826' : '#FFFFFF'}
                                />
                            ) : (
                                <Text
                                    style={[
                                        styles.stepNumber,
                                        { color: isDark ? '#9CA3AF' : '#94A3B8' },
                                        (isCompleted || isActive) && {
                                            color: isDark && isActive ? '#121826' : '#FFFFFF',
                                        },
                                    ]}
                                >
                                    {s.step}
                                </Text>
                            )}
                        </View>
                        <Text
                            style={[
                                styles.stepLabel,
                                { color: isDark ? '#9CA3AF' : '#94A3B8' },
                                isActive && {
                                    color: isDark ? '#FFB74D' : '#283593',
                                    fontWeight: '700',
                                },
                            ]}
                        >
                            {s.label}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        position: 'relative',
        marginHorizontal: 12,
    },
    backgroundLine: {
        position: 'absolute',
        left: 20,
        right: 20,
        height: 3,
        top: 32,
    },
    activeLine: {
        position: 'absolute',
        left: 20,
        height: 3,
        top: 32,
    },
    stepItem: {
        alignItems: 'center',
        zIndex: 1,
    },
    stepCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumber: {
        fontSize: 13,
        fontWeight: '700',
    },
    stepLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 6,
    },
});
