import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StepIndicatorProps {
    currentStep: number;
}

const STEPS = [
    { step: 1, label: 'Identidad' },
    { step: 2, label: 'Oficios' },
    { step: 3, label: 'Fiscal' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
    return (
        <View style={styles.container}>
            <View style={styles.backgroundLine} />
            <View
                style={[
                    styles.activeLine,
                    { width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` },
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
                                isCompleted && styles.circleCompleted,
                                isActive && styles.circleActive,
                            ]}
                        >
                            {isCompleted ? (
                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            ) : (
                                <Text
                                    style={[
                                        styles.stepNumber,
                                        (isCompleted || isActive) && styles.stepNumberActive,
                                    ]}
                                >
                                    {s.step}
                                </Text>
                            )}
                        </View>
                        <Text
                            style={[
                                styles.stepLabel,
                                isActive && styles.stepLabelActive,
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
        backgroundColor: '#E2E8F0',
        top: 32,
    },
    activeLine: {
        position: 'absolute',
        left: 20,
        height: 3,
        backgroundColor: '#FF8C00',
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
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleCompleted: {
        backgroundColor: '#283593',
        borderColor: '#283593',
    },
    circleActive: {
        backgroundColor: '#FF8C00',
        borderColor: '#FF8C00',
    },
    stepNumber: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94A3B8',
    },
    stepNumberActive: {
        color: '#FFFFFF',
    },
    stepLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 6,
    },
    stepLabelActive: {
        color: '#283593',
        fontWeight: '700',
    },
});
