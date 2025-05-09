import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useSegments, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/theme/useColorScheme';
import { AppProvider, useAppContext } from '@/context/AppContext';
import { DrizzleStudioDevTool } from '@/database/DrizzleStudio';

SplashScreen.preventAutoHideAsync();

function useProtectedRoute(isLoggedIn: boolean, loading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't redirect during loading
    
    const inAuthGroup = segments[0] === 'login';
    
    if (!isLoggedIn && !inAuthGroup) {
      // Redirect to the login page if not logged in
      router.replace('/login');
    } else if (isLoggedIn && inAuthGroup) {
      // Redirect to the home page if logged in and trying to access login page
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, segments, loading]);
}

function RootLayoutNav() {
  const { isLoggedIn, loading } = useAppContext();

  // Call the hook unconditionally
  useProtectedRoute(isLoggedIn, loading);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="login" 
          options={{ headerShown: false, gestureEnabled: false }} 
        />
        <Stack.Screen 
          name="ChatRoom" 
          options={{ headerShown: true }} 
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      {__DEV__ && <DrizzleStudioDevTool />}
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppProvider>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </AppProvider>
    </ThemeProvider>
  );
}
