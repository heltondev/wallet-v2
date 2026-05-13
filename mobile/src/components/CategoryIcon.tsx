import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Icons } from './icons/Icons';
import { CATS } from '../data/categories';

interface CategoryIconProps {
  cat?: string;
  size?: number;
  radius?: number;
}

export function CategoryIcon({ cat = 'outros', size = 36, radius = 10 }: CategoryIconProps) {
  const c = CATS[cat] || CATS.outros;
  const Ic = Icons[c.icon] || Icons.wallet;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: c.color + '2E',
        },
      ]}
    >
      <Ic size={Math.round(size * 0.5)} color={c.color} stroke={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
