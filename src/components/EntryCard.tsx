import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { colors, spacing, fontSizes, fonts, lineHeights } from '../theme'
import type { DiaryEntryWithMood } from '../lib/supabase-types'

interface EntryCardProps {
  entry: DiaryEntryWithMood
}

/**
 * 日记条目卡片——简化版
 * @deprecated 纸感风格改用纯文字分割线布局
 */
export function EntryCard({ entry }: EntryCardProps) {
  const time = new Date(entry.created_at).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const avatarLetter = (entry.author_name ?? '?').charAt(0)
  const imageCount = (entry as any).image_count ?? 0

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/entry/${entry.id}`)}
    >
      <View style={styles.row}>
        {/* 作者小圆点 */}
        <View style={styles.authorDot}>
          <Text style={styles.authorDotText}>{avatarLetter}</Text>
        </View>

        {/* 内容 */}
        <View style={styles.contentArea}>
          <Text style={styles.content} numberOfLines={2}>
            {entry.content}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.time}>{time}</Text>
            {imageCount > 0 && <Text style={styles.imageIcon}>📷</Text>}
            {entry.mood && (
              <Text style={styles.mood}>{entry.mood.emoji}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.divider} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  authorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  authorDotText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
  contentArea: {
    flex: 1,
  },
  content: {
    fontSize: fontSizes.body,
    fontFamily: fonts.sans,
    color: colors.text,
    lineHeight: lineHeights.body,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  time: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
  },
  imageIcon: {
    fontSize: 12,
  },
  mood: {
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: spacing.lg,
  },
})
