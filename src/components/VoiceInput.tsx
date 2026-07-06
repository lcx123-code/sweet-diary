/**
 * 语音输入组件
 *
 * 当前状态：模拟版（Expo Go 可运行）
 *
 * 解锁真实语音：
 *   1. npx expo install expo-dev-client
 *   2. npx expo run:ios  或  npx expo run:android
 *   3. 代码改为：
 *      import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition'
 */
import React, { useState, useCallback } from 'react'
import { TouchableOpacity, Text, StyleSheet, View, Alert } from 'react-native'
import { colors, spacing } from '../theme'

interface VoiceInputProps {
  onResult: (text: string) => void
}

type VoiceState = 'idle' | 'listening' | 'processing'

export function VoiceInput({ onResult }: VoiceInputProps) {
  const [state, setState] = useState<VoiceState>('idle')

  const toggle = useCallback(async () => {
    if (state === 'idle') {
      setState('listening')
      // TODO: expo-speech-recognition（需 Dev Build）
      setTimeout(() => {
        setState('processing')
        setTimeout(() => {
          Alert.alert('提示', '语音输入需要开发构建（Dev Build）')
          setState('idle')
        }, 500)
      }, 2000)
    } else {
      setState('idle')
    }
  }, [state, onResult])

  const isListening = state === 'listening'

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        onPress={toggle}
        style={[styles.button, isListening && styles.buttonActive]}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>
          {state === 'processing' ? '⏳' : state === 'listening' ? '🔴' : '🎤'}
        </Text>
      </TouchableOpacity>

      {isListening && (
        <Text style={styles.hint}>正在聆听...</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  buttonActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  icon: {
    fontSize: 24,
  },
  hint: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
  },
})
