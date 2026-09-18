import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Import navigators and screens
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DetailsScreen from '../screens/DetailsScreen';
import PlayerScreen from '../screens/PlayerScreen';
import SearchScreen from '../screens/SearchScreen';
import LiveTVScreen from '../screens/LiveTVScreen';
import SportsScreen from '../screens/SportsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import StaticPagesScreen from '../screens/StaticPagesScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import CareersScreen from '../screens/CareersScreen';
import SubmissionScreen from '../screens/SubmissionScreen';
import PocketReelsScreen from '../screens/PocketReelsScreen';

const Stack = createNativeStackNavigator();

function MainStack({ theme }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen name="Player" component={PlayerScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="LiveTV" component={LiveTVScreen} />
      <Stack.Screen name="Sports" component={SportsScreen} />
      <Stack.Screen name="PocketReels" component={PocketReelsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="StaticPage" component={StaticPagesScreen} />
      <Stack.Screen name="Careers" component={CareersScreen} />
      <Stack.Screen name="Submission" component={SubmissionScreen} />
      <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { loading } = useContext(AuthContext);
  const { theme, isDark } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const dynamicNavTheme = {
    ...baseTheme,
    dark: isDark,
    colors: {
      ...baseTheme.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.headerBackground,
      text: theme.text,
      border: theme.cardBorder,
      notification: theme.primary,
    },
  };

  return (
    <NavigationContainer theme={dynamicNavTheme}>
      <MainStack theme={theme} />
    </NavigationContainer>
  );
}
