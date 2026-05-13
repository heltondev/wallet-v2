import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { Workspace } from '../types';

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  activeId: string | null;
  onChange: (id: string | null) => void;
}

export function WorkspaceSelector({ workspaces, activeId, onChange }: WorkspaceSelectorProps) {
  const { colors } = useTheme();

  if (workspaces.length === 0) return null;

  const owned = [...workspaces].filter(w => w.ownership !== 'shared').sort((a, b) => a.order - b.order);
  const shared = [...workspaces].filter(w => w.ownership === 'shared').sort((a, b) => a.order - b.order);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
      >
        {owned.length > 0 && (
          <TouchableOpacity
            style={[
              styles.pill,
              { borderColor: colors.border1 },
              activeId === null && { backgroundColor: colors.text1, borderColor: colors.text1 },
            ]}
            onPress={() => onChange(null)}
          >
            <Text
              style={[
                styles.pillText,
                { color: colors.text3 },
                activeId === null && { color: colors.bg0 },
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>
        )}
        {owned.map(ws => (
          <TouchableOpacity
            key={ws.id}
            style={[
              styles.pill,
              { borderColor: colors.border1 },
              activeId === ws.id && { backgroundColor: colors.text1, borderColor: colors.text1 },
            ]}
            onPress={() => onChange(ws.id)}
          >
            {ws.icon ? <Text style={styles.pillIcon}>{ws.icon}</Text> : null}
            <Text
              style={[
                styles.pillText,
                { color: colors.text3 },
                activeId === ws.id && { color: colors.bg0 },
              ]}
            >
              {ws.name}
            </Text>
          </TouchableOpacity>
        ))}
        {shared.length > 0 && (
          <View style={[styles.separator, { backgroundColor: colors.border1 }]} />
        )}
        {shared.map(ws => (
          <TouchableOpacity
            key={ws.id}
            style={[
              styles.pill,
              { borderColor: colors.border1 },
              activeId === ws.id && { backgroundColor: colors.text1, borderColor: colors.text1 },
            ]}
            onPress={() => onChange(ws.id)}
          >
            {ws.icon ? <Text style={styles.pillIcon}>{ws.icon}</Text> : null}
            <Text
              style={[
                styles.pillText,
                { color: colors.text3 },
                activeId === ws.id && { color: colors.bg0 },
              ]}
            >
              {ws.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
  },
  pillIcon: {
    fontSize: 14,
  },
  separator: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
  },
});
