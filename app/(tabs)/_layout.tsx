import { StyleSheet, TouchableOpacity, Text, View } from 'react-native'
import { Tabs, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSizes } from '../../src/theme'
import { ErrorBoundary } from '../../src/components/ErrorBoundary'

export default function TabLayout() {
  return (
    <ErrorBoundary>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.separator,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 62,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 6,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '今天',
          tabBarIcon: ({ color }) => (
            <Ionicons name="book-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plus"
        options={{
          title: '写',
          tabBarIcon: ({ color }) => (
            <View style={styles.plusIcon}>
              <Ionicons name="add" size={28} color={colors.textOnAccent} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault()
            router.push('/write')
          },
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: '回忆',
          tabBarIcon: ({ color }) => (
            <Ionicons name="time-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  plusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
})
