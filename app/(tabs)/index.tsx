import { useEffect, useCallback, useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { MemoryCard } from '../../src/components/MemoryCard'
import { useAuthStore } from '../../src/store/authStore'
import { useCoupleStore } from '../../src/store/coupleStore'
import { useDiaryStore } from '../../src/store/diaryStore'
import { useMoodStore } from '../../src/store/moodStore'
import { colors, fontSizes, spacing, fonts, radii } from '../../src/theme'

/**
 * Together Journal 首页 — 杂志式记忆流
 */
export default function HomeScreen() {
  const user = useAuthStore((s) => s.user)
  const {
    coupleId,
    status: coupleStatus,
    inviteCode,
    isLoading: coupleLoading,
    myConfirmed,
    partnerName,
    createdAt: coupleCreatedAt,
    fetchMyCouple,
    createCouple,
    confirmPartner,
  } = useCoupleStore()
  const { timeline, isLoading: diaryLoading, fetchTimeline } = useDiaryStore()
  const fetchMoods = useMoodStore((s) => s.fetchMoods)
  const [refreshing, setRefreshing] = useState(false)

  // 计算在一起天数
  const daysTogether = useMemo(() => {
    if (!coupleCreatedAt) return null
    const start = new Date(coupleCreatedAt)
    const now = new Date()
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }, [coupleCreatedAt])

  // 所有条目平铺（按时间倒序）
  const allEntries = useMemo(() => {
    const entries = timeline.flatMap((g) => g.entries)
    return entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [timeline])

  const todayEntries = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return allEntries.filter((e) => e.created_at.slice(0, 10) === today)
  }, [allEntries])

  const latestEntry = allEntries[0]
  const namesLine = [user?.name, partnerName].filter(Boolean).join(' & ') || '你们的日记'

  useEffect(() => {
    if (!user) return
    fetchMoods()
    fetchMyCouple(user)
  }, [user])

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

  const handleCreateCouple = async () => {
    if (!user) return
    const res = await createCouple(user.id)
    if (res.error) console.warn(res.error)
  }

  // ─── 状态: 无伴侣 ───
  if (coupleStatus === 'none' && !coupleLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
        <Text style={styles.greeting}>{user?.name ?? '你的日记'}</Text>
        <Text style={styles.centerSubtitle}>邀请一个人，一起写这本日记</Text>
        <View style={styles.inviteSection}>
          <TouchableOpacity style={styles.accentButton} onPress={handleCreateCouple}>
            <Text style={styles.accentButtonText}>生成邀请码</Text>
          </TouchableOpacity>
          <Text style={styles.orText}>或</Text>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => router.push('/couple-join')}
          >
            <Text style={styles.outlineButtonText}>输入邀请码</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  // ─── 状态: 等待伴侣确认 ───
  if (coupleStatus === 'pending' && !coupleLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
        {!myConfirmed ? (
          <>
            <Text style={styles.greeting}>{user?.name ?? '你的日记'}</Text>
            <Text style={styles.centerSubtitle}>
              {partnerName
                ? `${partnerName} 已加入，确认关系后开始写日记`
                : '邀请码已生成，等待对方加入'}
            </Text>
            {inviteCode && (
              <View style={styles.inviteCodeBox}>
                <Text style={styles.inviteCodeLabel}>邀请码</Text>
                <Text style={styles.inviteCode}>{inviteCode}</Text>
              </View>
            )}
            {partnerName && (
              <TouchableOpacity
                style={styles.accentButton}
                onPress={async () => {
                  if (!user) return
                  await confirmPartner(user.id)
                }}
              >
                <Text style={styles.accentButtonText}>确认伴侣</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.refreshLink}>刷新状态</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.greeting}>{user?.name ?? '你的日记'}</Text>
            <Text style={styles.centerSubtitle}>
              已确认，等待 {partnerName ?? '对方'} 确认
            </Text>
            {inviteCode && (
              <View style={styles.inviteCodeBox}>
                <Text style={styles.inviteCode}>{inviteCode}</Text>
              </View>
            )}
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.refreshLink}>刷新状态</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    )
  }

  // ─── 状态: 加载中 ───
  if (coupleLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  // ─── 状态: 首页 ───
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <View style={styles.coverSection}>
          <Text style={styles.namesLine}>{namesLine}</Text>
          {daysTogether !== null && (
            <Text style={styles.daysLine}>
              <Text style={styles.daysNumber}>{daysTogether}</Text>
              {' '}天
            </Text>
          )}
          <Text style={styles.subtitle}>一起写下的日子</Text>
        </View>

        <View style={styles.todaySection}>
          <View>
            <Text style={styles.sectionLabel}>今天</Text>
            <Text style={styles.todayTitle}>
              {todayEntries.length > 0 ? `已经记录 ${todayEntries.length} 条` : '还没有记录'}
            </Text>
            <Text style={styles.todayPreview} numberOfLines={2}>
              {todayEntries[0]?.content ?? '写一句今天的小事，把这一页留给你们。'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.writeButton}
            onPress={() => router.push('/write')}
            activeOpacity={0.8}
          >
            <Text style={styles.writeButtonText}>写一点</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerDivider} />

        <View style={styles.recentHeader}>
          <Text style={styles.sectionLabel}>最近</Text>
          {latestEntry && (
            <Text style={styles.latestHint}>
              上次记录 · {formatShortDate(latestEntry.created_at)}
            </Text>
          )}
        </View>

        {diaryLoading && allEntries.length === 0 ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: spacing.lg }} />
        ) : allEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>还没有记录</Text>
            <Text style={styles.emptyDesc}>从一句话开始也很好。</Text>
          </View>
        ) : (
          <View style={styles.feedList}>
            {allEntries.slice(0, 6).map((entry, i) => (
              <MemoryCard key={entry.id} entry={entry} index={i} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function formatShortDate(value: string): string {
  const date = new Date(value)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  feedContent: {
    padding: spacing.sm,
    paddingTop: Platform.OS === 'ios' ? 56 + spacing.sm : spacing.sm,
    paddingBottom: 100,
  },
  // ─── 首页 — 书的封面 ───
  coverSection: {
    paddingLeft: spacing.xs,
    marginBottom: spacing.md,
  },
  namesLine: {
    fontSize: fontSizes.h1,
    fontFamily: fonts.serif,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  daysLine: {
    fontSize: fontSizes.h0,
    fontFamily: fonts.serif,
    color: colors.text,
    letterSpacing: 1,
  },
  daysNumber: {
    fontFamily: fonts.serifBold,
    color: colors.accent,
    fontSize: 56,
  },
  subtitle: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  todaySection: {
    marginHorizontal: spacing.xs,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    marginBottom: 6,
  },
  todayTitle: {
    fontSize: fontSizes.h1,
    fontFamily: fonts.serif,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  todayPreview: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    lineHeight: 28,
  },
  writeButton: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  writeButtonText: {
    color: colors.textOnAccent,
    fontSize: fontSizes.caption,
    fontWeight: '600',
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  recentHeader: {
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  latestHint: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  // ─── 记忆流 ───
  feedList: {},
  // ─── 邀请状态 ───
  greeting: {
    fontSize: fontSizes.h1,
    fontFamily: fonts.serif,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  centerSubtitle: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  inviteSection: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  accentButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 180,
    alignItems: 'center',
  },
  accentButtonText: {
    color: colors.textOnAccent,
    fontSize: fontSizes.body,
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 180,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: colors.accent,
    fontSize: fontSizes.body,
    fontWeight: '600',
  },
  orText: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  inviteCodeBox: {
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  inviteCodeLabel: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  inviteCode: {
    fontSize: fontSizes.dateTitle,
    fontFamily: fonts.serifBold,
    color: colors.accent,
    letterSpacing: 8,
  },
  refreshLink: {
    fontSize: fontSizes.body,
    color: colors.accent,
    marginTop: spacing.sm,
  },
  emptyState: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  emptyTitle: {
    fontSize: fontSizes.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
})
