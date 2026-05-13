import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ToastMessage, { BaseToast, type BaseToastProps } from 'react-native-toast-message';

function SuccessToast(props: BaseToastProps) {
  return (
    <BaseToast
      {...props}
      style={[styles.base, styles.success]}
      contentContainerStyle={styles.content}
      text1Style={styles.text1}
      text2Style={styles.text2}
    />
  );
}

function ErrorToast(props: BaseToastProps) {
  return (
    <BaseToast
      {...props}
      style={[styles.base, styles.error]}
      contentContainerStyle={styles.content}
      text1Style={styles.text1}
      text2Style={styles.text2}
    />
  );
}

export const toastConfig = {
  success: (props: BaseToastProps) => <SuccessToast {...props} />,
  error: (props: BaseToastProps) => <ErrorToast {...props} />,
};

export function showToast(desc: string, amount?: number) {
  const text2 = amount != null
    ? `${amount >= 0 ? '+' : ''}R$ ${Math.abs(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : undefined;

  ToastMessage.show({
    type: 'success',
    text1: desc,
    text2,
    visibilityTime: 2500,
    topOffset: 60,
  });
}

export { ToastMessage };

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderLeftWidth: 0,
  },
  success: {
    backgroundColor: '#141414',
    borderColor: '#2A2A2A',
    borderWidth: 1,
  },
  error: {
    backgroundColor: '#1C1010',
    borderColor: '#3B1515',
    borderWidth: 1,
  },
  content: {
    paddingHorizontal: 12,
  },
  text1: {
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: '#FAFAFA',
  },
  text2: {
    fontSize: 13,
    fontFamily: 'GeistMono-Regular',
    color: '#A1A1AA',
    fontVariant: ['tabular-nums'],
  },
});
