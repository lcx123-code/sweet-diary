import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { GlassButton } from '../src/components/GlassButton'
import { useAuthStore } from '../src/store/authStore'
import { useCoupleStore } from '../src/store/coupleStore'
import { colors, spacing, fontSizes, fonts, radii, lineHeights } from '../src/theme'

export default function CoupleJoinScreen() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const joinCouple = useCoupleStore((s) => s.joinCouple)

  const handleJoin = async () => {
    if (!user || !code.trim()) return

    setLoading(true)
    const { error } = await joinCouple(user.id, code.trim())
    setLoading(false)

    if (error) {
      Alert.alert('加入失败', error)
      return
    }

    Alert.alert('成功', '已加入，等待对方确认', [
      { text: '好的', onPress: () => router.back() },
    ])
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.back} onPress={() => router.back()}>
        ← 返回
      </Text>

      <Text style={styles.title}>输入邀请码</Text>
      <Text style={styles.subtitle}>
        请对方把邀请码给你，输入后即可加入
      </Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="6 位邀请码"
          placeholderTextColor={colors.textMuted}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          maxLength={6}
          textAlign="center"
        />
      </View>

      <GlassButton
        title="加入"
        onPress={handleJoin}
        loading={loading}
        disabled={code.trim().length < 4}
        style={styles.button}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.sm,
    paddingTop: Platform.OS === 'ios' ? 56 : spacing.sm,
    gap: spacing.sm,
  },
  back: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  title: {
    fontSize: fontSizes.dateTitle,
    fontFamily: fonts.serifBold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    lineHeight: lineHeights.body,
  },
  inputWrapper: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  input: {
    padding: spacing.sm,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: fonts.serif,
    color: colors.accent,
    letterSpacing: 8,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.xs,
  },
})
