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

export default function RegisterScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const signUp = useAuthStore((s) => s.signUp)

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('提示', '请填写所有字段')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次密码不一致')
      return
    }
    if (password.length < 6) {
      Alert.alert('提示', '密码至少6位')
      return
    }

    setLoading(true)
    const { error } = await signUp(email.trim(), password, name.trim())
    setLoading(false)

    if (error) {
      Alert.alert('注册失败', error)
    } else {
      Alert.alert('注册成功', '请查看邮箱确认链接（或直接登录）', [
        { text: '去登录', onPress: () => router.replace('/login') },
      ])
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>创建账号</Text>
        <Text style={styles.subtitle}>开始记录你们的日常</Text>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="昵称"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>
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
              placeholder="密码（至少6位）"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="确认密码"
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <GlassButton
            title="注 册"
            onPress={handleRegister}
            loading={loading}
            style={styles.button}
          />

          <Text style={styles.link} onPress={() => router.replace('/login')}>
            已有账号？去登录
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
    paddingBottom: 40,
  },
  title: {
    fontSize: fontSizes.dateTitle,
    fontFamily: fonts.serifBold,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
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
    marginTop: spacing.xs,
  },
  link: {
    textAlign: 'center',
    color: colors.accent,
    fontSize: fontSizes.body,
    marginTop: spacing.sm,
  },
})
