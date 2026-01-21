import { usePointsStore } from '@entities/points';
import { useAuthStore } from '@entities/user';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@shared/ui';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface PointsDisplayProps {
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export function PointsDisplay({
  showIcon = true,
  size = 'medium',
  style,
}: PointsDisplayProps) {
  const { totalPoints, isLoading, fetchPoints } = usePointsStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchPoints();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  const fontSize = size === 'small' ? 14 : size === 'large' ? 20 : 16;
  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  return (
    <View style={[styles.container, style]}>
      {showIcon && (
        <Ionicons
          name="cash-outline"
          size={iconSize}
          color="#fff"
          style={styles.icon}
        />
      )}
      <ThemedText style={[styles.points, { fontSize }]}>
        {totalPoints.toLocaleString()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  points: {
    color: '#fff',
    fontWeight: '600',
  },
});
