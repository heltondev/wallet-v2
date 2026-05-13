import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Icons } from '../components/icons/Icons';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ContasScreen } from '../screens/ContasScreen';
import { PrevisaoScreen } from '../screens/PrevisaoScreen';
import { CategoriasScreen } from '../screens/CategoriasScreen';
import { AjustesScreen } from '../screens/AjustesScreen';
import { PaymentSheet } from '../screens/PaymentSheet';
import { ManageAccountsScreen } from '../screens/ManageAccountsScreen';
import { ManageCategoriesScreen } from '../screens/ManageCategoriesScreen';
import { ManageRecurringScreen } from '../screens/ManageRecurringScreen';
import { ManageWorkspacesScreen } from '../screens/ManageWorkspacesScreen';
import { VerifyPaymentsScreen } from '../screens/VerifyPaymentsScreen';
import { AiChatScreen } from '../screens/AiChatScreen';
import { AiInsightsScreen } from '../screens/AiInsightsScreen';
import { ReceiptScreen } from '../screens/ReceiptScreen';
import { AdminCostsScreen } from '../screens/AdminCostsScreen';
import { ManagePromptsScreen } from '../screens/ManagePromptsScreen';
import type { RecurringTransaction } from '../types';

export type TabParamList = {
  HomeTab: undefined;
  ContasTab: undefined;
  PrevisaoTab: undefined;
  CategoriasTab: undefined;
  AjustesTab: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  PaymentSheet: { recurring: RecurringTransaction };
  ManageAccounts: undefined;
  ManageCategories: undefined;
  ManageRecurring: undefined;
  ManageWorkspaces: undefined;
  VerifyPayments: undefined;
  AiChat: undefined;
  AiInsights: undefined;
  Receipt: undefined;
  AdminCosts: undefined;
  ManagePrompts: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_CONFIG: Record<
  keyof TabParamList,
  { label: string; icon: keyof typeof Icons }
> = {
  HomeTab: { label: 'Home', icon: 'home' },
  ContasTab: { label: 'Contas', icon: 'repeat' },
  PrevisaoTab: { label: 'Previsao', icon: 'trending' },
  CategoriasTab: { label: 'Categorias', icon: 'grid' },
  AjustesTab: { label: 'Ajustes', icon: 'settings' },
};

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const cfg = TAB_CONFIG[route.name];
          const IconComponent = Icons[cfg.icon];
          return (
            <IconComponent
              size={22}
              color={focused ? colors.pos : colors.text3}
              stroke={focused ? 2 : 1.5}
            />
          );
        },
        tabBarActiveTintColor: colors.pos,
        tabBarInactiveTintColor: colors.text3,
        tabBarStyle: {
          backgroundColor: colors.bg1,
          borderTopColor: colors.border1,
          borderTopWidth: 0.5,
          paddingTop: Platform.OS === 'ios' ? 8 : 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'Geist',
          fontSize: 11,
          fontWeight: '600' as const,
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: TAB_CONFIG.HomeTab.label }}
      />
      <Tab.Screen
        name="ContasTab"
        component={ContasScreen}
        options={{ tabBarLabel: TAB_CONFIG.ContasTab.label }}
      />
      <Tab.Screen
        name="PrevisaoTab"
        component={PrevisaoScreen}
        options={{ tabBarLabel: TAB_CONFIG.PrevisaoTab.label }}
      />
      <Tab.Screen
        name="CategoriasTab"
        component={CategoriasScreen}
        options={{ tabBarLabel: TAB_CONFIG.CategoriasTab.label }}
      />
      <Tab.Screen
        name="AjustesTab"
        component={AjustesScreen}
        options={{ tabBarLabel: TAB_CONFIG.AjustesTab.label }}
      />
    </Tab.Navigator>
  );
}

interface AppNavigatorProps {
  isAuthenticated: boolean;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({
  isAuthenticated,
}) => {
  const { colors, isDark } = useTheme();
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.bg0,
      card: colors.bg1,
      text: colors.text1,
      border: colors.border1,
      primary: colors.pos,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="PaymentSheet"
              component={PaymentSheet}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="ManageAccounts" component={ManageAccountsScreen} />
            <Stack.Screen name="ManageCategories" component={ManageCategoriesScreen} />
            <Stack.Screen name="ManageRecurring" component={ManageRecurringScreen} />
            <Stack.Screen name="ManageWorkspaces" component={ManageWorkspacesScreen} />
            <Stack.Screen name="VerifyPayments" component={VerifyPaymentsScreen} />
            <Stack.Screen name="AiChat" component={AiChatScreen} />
            <Stack.Screen name="AiInsights" component={AiInsightsScreen} />
            <Stack.Screen name="Receipt" component={ReceiptScreen} />
            <Stack.Screen name="AdminCosts" component={AdminCostsScreen} />
            <Stack.Screen name="ManagePrompts" component={ManagePromptsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
