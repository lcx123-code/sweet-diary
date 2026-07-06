import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, fontSizes, fonts } from '../theme'
import type { DiaryEntryWithMood } from '../lib/supabase-types'

interface DiaryDayGroupProps {
  date: string
  entries: DiaryEntryWithMood[]
}

/**
 * 日记日期分组——简化版
 * @deprecated 纸感风格改用纯文字布局
 */
export function DiaryDayGroup({ date, entries }: DiaryDayGroupProps) {
  const d = new Date(date + 'T00:00:00')
  const dateLabel = `${d.getMonth() + 1}月${d.getDate()}日`

  return (
    <View style={styles.group}>
      <Text style={styles.dateLabel}>{dateLabel}</Text>
      <View style={styles.divider} />
      {entries.map((entry) => (
        <View key={entry.id} style={styles.entryRow}>
          <View style={styles.authorDot} />
          <Text style={styles.entryPreview} numberOfLines={1}>
            {entry.content}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  group: {
    marginBottom: spacing.sm,
  },
  dateLabel: {
    fontSize: fontSizes.h1,
    fontFamily: fonts.serif,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginBottom: spacing.xs,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
  },
  authorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  entryPreview: {
    flex: 1,
    fontSize: fontSizes.body,
    color: colors.text,
  },
})
