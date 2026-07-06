import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../src/store/authStore'
import { GlassButton } from '../../src/components/GlassButton'
import { colors, fontSizes, spacing, fonts, radii } from '../../src/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const signIn = useAuthStore((s) => s.signIn)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('提示', '请输入邮箱和密码')
      return
    }
    setLoading(true)

    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) {
      Alert.alert('登录失败', error)
      return
    }
    router.replace('/(tabs)')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.appName}>Sweet Diary</Text>
        <Text style={styles.subtitle}>属于两个人的日记本</Text>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="邮箱"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="密码"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <GlassButton
            title="登 录"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
          />

          <Text style={styles.link} onPress={() => router.replace('/register')}>
            还没有账号？立即注册
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 60,
  },
  appName: {
    fontSize: 40,
    fontFamily: fonts.serifBold,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.sm,
  },
  inputWrapper: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  input: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.body,
    color: colors.text,
  },
  button: {
    marginTop: spacing.sm,
  },
  link: {
    textAlign: 'center',
    color: colors.accent,
    fontSize: fontSizes.body,
    marginTop: spacing.sm,
  },
})
