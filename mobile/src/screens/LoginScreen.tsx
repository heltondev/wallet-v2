import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import { cognitoService } from '../services/cognitoService';
import {
  FONT_SANS,
  FS_DISPLAY,
  FS_BODY,
  FS_CAPTION,
  FW_BOLD,
  FW_MEDIUM,
  FW_REGULAR,
} from '../styles/typography';
import { S3, S4, S5, S6, R_CARD, R_INPUT } from '../styles/spacing';

function GoogleLogo() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.27l3.66-2.84z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export function LoginScreen() {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg0,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: S5,
    },
    content: {
      alignItems: 'center',
      width: '100%',
    },
    brand: {
      fontFamily: FONT_SANS,
      fontSize: FS_DISPLAY,
      fontWeight: FW_BOLD,
      color: colors.text1,
      marginBottom: S3,
    },
    subtitle: {
      fontFamily: FONT_SANS,
      fontSize: FS_BODY,
      fontWeight: FW_REGULAR,
      color: colors.text3,
      marginBottom: S6 + S6,
    },
    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: S3,
      backgroundColor: colors.bg2,
      borderRadius: R_INPUT,
      paddingVertical: S4,
      paddingHorizontal: S5,
      width: '100%',
      borderWidth: 1,
      borderColor: colors.border1,
    },
    googleBtnText: {
      fontFamily: FONT_SANS,
      fontSize: FS_BODY,
      fontWeight: FW_MEDIUM,
      color: colors.text1,
    },
    footer: {
      fontFamily: FONT_SANS,
      fontSize: FS_CAPTION,
      fontWeight: FW_REGULAR,
      color: colors.text4,
      marginTop: S6 + S6,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.brand}>Wallet</Text>
        <Text style={styles.subtitle}>Controle financeiro pessoal</Text>

        <TouchableOpacity
          style={styles.googleBtn}
          onPress={cognitoService.signInWithGoogle}
          activeOpacity={0.7}
        >
          <GoogleLogo />
          <Text style={styles.googleBtnText}>Entrar com Google</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Powered by AI</Text>
      </View>
    </View>
  );
}
