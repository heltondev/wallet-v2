import React from 'react';
import type { ReactNode } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Icons } from './icons/Icons';
import { useTheme } from '../hooks/useTheme';

interface ChipProps {
  children: ReactNode;
  active?: boolean;
  color?: string;
  onPress?: () => void;
  leadingDot?: boolean;
  leadingIcon?: string;
}

export function Chip({ children, active, color, onPress, leadingDot, leadingIcon }: ChipProps) {
  const { colors } = useTheme();
  const Ic = leadingIcon ? Icons[leadingIcon] : undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: colors.border1 },
        active && { backgroundColor: colors.text1, borderColor: colors.text1 },
      ]}
    >
      {leadingDot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: color || colors.pos },
          ]}
        />
      )}
      {Ic && <Ic size={13} color={active ? colors.bg0 : colors.text2} />}
      <Text
        style={[
          styles.label,
          { color: colors.text3 },
          active && { color: colors.bg0 },
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
  },
});
