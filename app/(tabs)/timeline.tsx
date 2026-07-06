import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../src/store/authStore'
import { useCoupleStore } from '../../src/store/coupleStore'
import { useDiaryStore } from '../../src/store/diaryStore'
import { colors, spacing, fontSizes, fonts, lineHeights } from '../../src/theme'
import type { DiaryEntryWithMood } from '../../src/lib/supabase-types'

/**
 * 时间轴 — 像书的目录
 * 里程碑条目用鼠尾草绿圆点作为视觉地标
 */
export default function TimelineScreen() {
  const user = useAuthStore((s) => s.user)
  const coupleId = useCoupleStore((s) => s.coupleId)
  const coupleStatus = useCoupleStore((s) => s.status)
  const fetchMyCouple = useCoupleStore((s) => s.fetchMyCouple)
  const { timeline, isLoading, fetchTimeline } = useDiaryStore()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (coupleStatus === 'active' && coupleId) {
      fetchTimeline(coupleId)
    }
  }, [coupleStatus, coupleId])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    if (user) await fetchMyCouple(user)
    if (coupleId) await fetchTimeline(coupleId)
    setRefreshing(false)
  }, [user, coupleId])

  const grouped = groupByYearMonth(timeline.flatMap((g) => g.entries))

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <Text style={styles.pageTitle}>回忆</Text>
        <Text style={styles.pageSubtitle}>你们一起写下的日子</Text>

        {isLoading && timeline.length === 0 ? (
          <ActivityIndicator
            size="large"
            color={colors.accent}
            style={{ marginTop: spacing.lg }}
          />
        ) : grouped.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>还没有记录</Text>
            <Text style={styles.emptySubtext}>从一句话开始也很好</Text>
          </View>
        ) : (
          grouped.map((year) => (
            <View key={year.label} style={styles.yearGroup}>
              <Text style={styles.yearLabel}>{year.label}</Text>
              {year.months.map((month) => (
                <View key={month.label} style={styles.monthGroup}>
                  <Text style={styles.monthLabel}>{month.label}</Text>
                  {month.entries.map((entry) => {
                    const isMilestone = !!entry.milestone_type
                    return (
                      <TouchableOpacity
                        key={entry.id}
                        style={[styles.entryRow, isMilestone && styles.entryRowMilestone]}
                        onPress={() => router.push(`/entry/${entry.id}`)}
                        activeOpacity={0.7}
                      >
                        {/* 地标圆点 */}
                        <View style={[styles.dot, isMilestone && styles.dotMilestone]} />

                        <Text style={styles.entryDate}>
                          {new Date(entry.created_at).getDate().toString().padStart(2, '0')}
                        </Text>

                        <View style={styles.entryTextArea}>
                          <Text
                            style={[styles.entryPreview, isMilestone && styles.entryPreviewMilestone]}
                            numberOfLines={isMilestone ? 3 : 1}
                          >
                            {entry.content}
                          </Text>
                          {isMilestone && entry.milestone_type && (
                            <Text style={styles.milestoneTag}>
                              {milestoneLabel(entry.milestone_type)}
                            </Text>
                          )}
                        </View>

                        {entry.image_url && (
                          <Image source={{ uri: entry.image_url }} style={styles.entryThumb} />
                        )}

                        <Text style={styles.entryAuthor}>
                          {entry.author_name?.charAt(0) ?? '?'}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                  {month.entries.length > 0 && (
                    <View style={styles.monthDivider} />
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
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

// ─── 分组工具 ────────────────────────────────────────

interface MonthGroup {
  label: string
  entries: DiaryEntryWithMood[]
}

interface YearGroup {
  label: string
  months: MonthGroup[]
}

function groupByYearMonth(entries: DiaryEntryWithMood[]): YearGroup[] {
  const map = new Map<string, Map<string, DiaryEntryWithMood[]>>()

  for (const entry of entries) {
    const d = new Date(entry.created_at)
    const year = `${d.getFullYear()}`
    const month = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`

    if (!map.has(year)) map.set(year, new Map())
    const yearMap = map.get(year)!
    if (!yearMap.has(month)) yearMap.set(month, [])
    yearMap.get(month)!.push(entry)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, monthMap]) => ({
      label: year,
      months: Array.from(monthMap.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, entries]) => ({
          label: `${parseInt(month.split('-')[1])}月`,
          entries: entries.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          ),
        })),
    }))
}

// ─── 样式 ────────────────────────────────────────────

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
  pageTitle: {
    fontSize: fontSizes.dateTitle,
    fontFamily: fonts.serifBold,
    color: colors.text,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  pageSubtitle: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  emptyText: {
    fontSize: fontSizes.body,
    color: colors.text,
  },
  emptySubtext: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  yearGroup: {
    marginBottom: spacing.md,
  },
  yearLabel: {
    fontSize: fontSizes.dateTitle,
    fontFamily: fonts.serifBold,
    color: colors.text,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    letterSpacing: 2,
  },
  monthGroup: {
    paddingLeft: spacing.xs,
  },
  monthLabel: {
    fontSize: fontSizes.h1,
    fontFamily: fonts.serif,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs - 4,
    paddingLeft: spacing.xs,
    gap: spacing.xs - 4,
  },
  entryRowMilestone: {
    backgroundColor: colors.accentLight,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs - 4,
    marginBottom: 4,
    marginHorizontal: -spacing.xs + 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.separator,
    marginTop: 6,
  },
  dotMilestone: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    marginTop: 4,
  },
  entryDate: {
    width: 24,
    fontSize: fontSizes.body,
    fontFamily: fonts.serif,
    color: colors.text,
    textAlign: 'center',
    marginTop: -2,
  },
  entryTextArea: {
    flex: 1,
  },
  entryPreview: {
    fontSize: fontSizes.body,
    color: colors.text,
    lineHeight: lineHeights.body,
  },
  entryPreviewMilestone: {
    fontWeight: '600',
  },
  milestoneTag: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 2,
  },
  entryAuthor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
    marginTop: 2,
  },
  entryThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    marginTop: 2,
  },
  monthDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginVertical: spacing.sm,
    marginLeft: spacing.lg,
  },
})
