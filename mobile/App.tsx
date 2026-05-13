import 'react-native-get-random-values';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import Toast from 'react-native-toast-message';
import ReactNativeBiometrics from 'react-native-biometrics';
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser } from 'aws-amplify/auth';
import { configureCognito } from './src/services/cognitoService';
import { useSettingsStore } from './src/store/useSettingsStore';
import { useWalletStore } from './src/store/useWalletStore';
import { AppNavigator } from './src/navigation/AppNavigator';
import { toastConfig } from './src/components/Toast';
import { darkColors, lightColors } from './src/styles/theme';
import './src/i18n';

const rnBiometrics = new ReactNativeBiometrics();

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const appState = useRef(AppState.currentState);
  const isDark = useSettingsStore(s => s.isDarkMode);
  const biometricLock = useSettingsStore(s => s.biometricLock);
  const loadData = useWalletStore(s => s.loadData);
  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    try {
      configureCognito();
    } catch (e) {
      console.warn('Cognito config error:', e);
    }
    checkAuth();
    const listener = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        setAuthed(true);
        setAuthLoading(false);
      }
      if (payload.event === 'signedOut') {
        setAuthed(false);
      }
    });
    return () => listener();
  }, []);

  const checkAuth = async () => {
    try {
      await getCurrentUser();
      setAuthed(true);
    } catch {
      setAuthed(false);
    } finally {
      setAuthLoading(false);
      await BootSplash.hide({ fade: true });
    }
  };

  useEffect(() => {
    if (authed) {
      loadData(null);
    }
  }, [authed, loadData]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (
        biometricLock &&
        authed &&
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        promptBiometric();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [biometricLock, authed]);

  const promptBiometric = useCallback(async () => {
    try {
      const { available } = await rnBiometrics.isSensorAvailable();
      if (!available) return;
      setLocked(true);
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Desbloquear Wallet',
      });
      if (success) setLocked(false);
    } catch {
      setLocked(false);
    }
  }, []);

  if (locked) {
    return (
      <View style={[styles.lockScreen, { backgroundColor: colors.bg0 }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.container, { backgroundColor: colors.bg0 }]}>
        {authLoading ? null : <AppNavigator isAuthenticated={authed} />}
      </View>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lockScreen: {
    flex: 1,
  },
});
