import React from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { colors, radii } from '../theme'

interface JournalCardProps {
  children: React.ReactNode
  style?: ViewStyle
}

/**
 * @deprecated 纸感风格不再使用卡片，优先使用分割线
 * 保留为简单 View 容器兼容旧引用
 */
export function JournalCard({ children, style }: JournalCardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
  },
})
