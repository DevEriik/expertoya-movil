import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ChatStatus } from '../../types/chat';

interface Props {
  status: ChatStatus;
  isDark?: boolean;
}

export const ChatStatusBadge: React.FC<Props> = ({ status, isDark = false }) => {
  switch (status) {
    case 'EN PROGRESO':
      return (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : '#FEF3C7',
              borderColor: isDark ? 'rgba(251, 191, 36, 0.3)' : '#FDE68A',
            },
          ]}
          accessible={true}
          accessibilityLabel="Estado: En Progreso"
        >
          <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
          <Text
            style={[
              styles.text,
              { color: isDark ? '#FBBF24' : '#D97706' },
            ]}
          >
            EN PROGRESO
          </Text>
        </View>
      );

    case 'ESCROW PENDIENTE':
      return (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isDark ? 'rgba(51, 239, 165, 0.15)' : '#E6F8F5',
              borderColor: isDark ? 'rgba(51, 239, 165, 0.3)' : '#B2DFDB',
            },
          ]}
          accessible={true}
          accessibilityLabel="Estado: Fideicomiso pendiente"
        >
          <View style={[styles.dot, { backgroundColor: '#00BFA5' }]} />
          <Text
            style={[
              styles.text,
              { color: isDark ? '#33EFA5' : '#00897B' },
            ]}
          >
            ESCROW PENDIENTE
          </Text>
        </View>
      );

    case 'COMPLETADO':
      return (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : '#ECFDF5',
              borderColor: isDark ? 'rgba(52, 211, 153, 0.3)' : '#A7F3D0',
            },
          ]}
          accessible={true}
          accessibilityLabel="Estado: Completado"
        >
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <Text
            style={[
              styles.text,
              { color: isDark ? '#34D399' : '#059669' },
            ]}
          >
            COMPLETADO
          </Text>
        </View>
      );

    default:
      return null;
  }
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
