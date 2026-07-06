import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import {
  NotoSerifSC_400Regular,
  NotoSerifSC_700Bold,
  useFonts,
} from '@expo-google-fonts/noto-serif-sc'
import { useAuthStore } from '../src/store/authStore'
import { colors } from '../src/theme'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [user, setUser] = useState(() => useAuthStore.getState().user)
  const [fontTimedOut, setFontTimedOut] = useState(false)
  const isLoading = useAuthStore((s) => s.isLoading)
  const hydrate = useAuthStore((s) => s.hydrate)

  // 加载宋体
  const [fontsLoaded] = useFonts({ NotoSerifSC_400Regular, NotoSerifSC_700Bold })

  useEffect(() => {
    const unsub = useAuthStore.subscribe((state, prevState) => {
      if (state.user !== prevState.user) {
        setUser(state.user)
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => SplashScreen.hideAsync(), 10000)
    hydrate()
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeout)
        SplashScreen.hideAsync()
      })
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => setFontTimedOut(true), 5_000)
    return () => clearTimeout(timeout)
  }, [])

  if (isLoading || (!fontsLoaded && !fontTimedOut)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <View style={styles.root} key={user ? 'tabs' : 'auth'}>
      <StatusBar style="dark" />

      {user ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="write" options={{ presentation: 'modal' }} />
          <Stack.Screen name="entry/[id]" />
          <Stack.Screen name="couple-join" options={{ presentation: 'modal' }} />
        </Stack>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
        </Stack>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
})
