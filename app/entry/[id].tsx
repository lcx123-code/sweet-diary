import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { ImageCollage } from '../../src/components/ImageCollage'
import { useDiaryStore } from '../../src/store/diaryStore'
import { colors, spacing, fontSizes, fonts, lineHeights } from '../../src/theme'
import type { DiaryEntryWithMood } from '../../src/lib/supabase-types'

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [entry, setEntry] = useState<DiaryEntryWithMood | null>(null)
  const [dayEntries, setDayEntries] = useState<DiaryEntryWithMood[]>([])
  const [loading, setLoading] = useState(true)
  const getEntry = useDiaryStore((s) => s.getEntry)
  const getDiaryEntries = useDiaryStore((s) => s.getDiaryEntries)

  useEffect(() => {
    if (!id) return
    setLoading(true)

    getEntry(id).then(async (entryData) => {
      setEntry(entryData)
      if (entryData?.diary_id) {
        const entries = await getDiaryEntries(entryData.diary_id)
        setDayEntries(entries.length > 0 ? entries : [entryData])
      } else {
        setDayEntries([])
      }
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  if (!entry) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>日记不存在</Text>
      </View>
    )
  }

  const date = new Date(entry.created_at)
  const dateStr = `${date.getMonth() + 1}.${date.getDate()}`

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 返回 */}
      <Text style={styles.back} onPress={() => router.back()}>
        返回
      </Text>

      {/* 日期 */}
      <Text style={styles.dateHeader}>{dateStr}</Text>

      <Text style={styles.dayHint}>
        {dayEntries.length > 1 ? `这一天写了 ${dayEntries.length} 段` : '这一天的一段记录'}
      </Text>

      {dayEntries.map((item) => (
        <View key={item.id} style={styles.entryBlock}>
          <View style={styles.authorRow}>
            <View style={styles.authorDot}>
              <Text style={styles.authorDotText}>{(item.author_name ?? '?').charAt(0)}</Text>
            </View>
            <Text style={styles.authorName}>{item.author_name ?? '记录者'}</Text>
            <Text style={styles.authorTime}>· {formatTime(item.created_at)}</Text>
            {item.mood && (
              <Text style={styles.moodEmoji}>{item.mood.emoji}</Text>
            )}
          </View>

          {item.content && (
            <Text style={styles.contentText}>{item.content}</Text>
          )}

          {item.images && item.images.length > 0 && (
            <ImageCollage images={item.images} style={styles.imageSection} />
          )}

          {item.milestone_type && (
            <View style={styles.milestoneBadge}>
              <Text style={styles.milestoneBadgeText}>
                {milestoneLabel(item.milestone_type)}
              </Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  )
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function milestoneLabel(type: string): string {
  const labels: Record<string, string> = {
    first_trip: '首次旅行',
    anniversary: '纪念日',
    birthday: '生日',
    move_in: '同居',
    proposal: '求婚',
    other: '特别时刻',
  }
  return labels[type] ?? '特别时刻'
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.sm,
    paddingTop: Platform.OS === 'ios' ? 56 + spacing.sm : spacing.sm,
    paddingBottom: 40,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  errorText: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  back: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    paddingLeft: spacing.xs,
  },
  dateHeader: {
    fontSize: fontSizes.dateTitle,
    fontFamily: fonts.serif,
    color: colors.text,
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  dayHint: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
    paddingLeft: spacing.xs,
  },
  entryBlock: {
    marginBottom: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs - 8,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  authorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  authorName: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  authorTime: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
  },
  moodEmoji: {
    fontSize: 18,
    marginLeft: 'auto',
  },
  milestoneBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentLight,
    borderRadius: 4,
    paddingHorizontal: spacing.xs - 4,
    paddingVertical: 2,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  milestoneBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  contentText: {
    fontSize: fontSizes.body,
    fontFamily: fonts.sans,
    color: colors.text,
    lineHeight: lineHeights.body,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  imageSection: {
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
})
