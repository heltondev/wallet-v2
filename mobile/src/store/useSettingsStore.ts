import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  isDarkMode: boolean;
  currency: 'BRL' | 'USD' | 'EUR';
  biometricLock: boolean;
  language: string;
  setDarkMode: (isDark: boolean) => void;
  setCurrency: (currency: 'BRL' | 'USD' | 'EUR') => void;
  setBiometricLock: (enabled: boolean) => void;
  setLanguage: (lang: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isDarkMode: true,
      currency: 'BRL',
      biometricLock: false,
      language: 'pt-BR',

      setDarkMode: (isDark) => set({ isDarkMode: isDark }),
      setCurrency: (currency) => set({ currency }),
      setBiometricLock: (enabled) => set({ biometricLock: enabled }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'wallet-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
