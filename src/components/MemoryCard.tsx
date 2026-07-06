import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { colors, spacing, fontSizes, fonts, lineHeights, radii } from '../theme'
import type { DiaryEntryWithMood } from '../lib/supabase-types'

const SCREEN_WIDTH = Dimensions.get('window').width

interface MemoryCardProps {
  entry: DiaryEntryWithMood
  index?: number
}

/**
 * 杂志式记忆卡片
 *
 * 3 种布局模板，根据照片和里程碑自动选择：
 *   Hero   — 全宽大图（里程碑或单张照片）
 *   Split  — 左图右文（多张照片）
 *   Text   — 纯文字摘录（无照片）
 */
export function MemoryCard({ entry, index = 0 }: MemoryCardProps) {
  const isMilestone = !!entry.milestone_type
  const hasImage = !!entry.image_url
  const layout = isMilestone ? 'hero' : hasImage ? (entry.image_width ? 'split' : 'hero') : 'text'

  const time = new Date(entry.created_at).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const authorLetter = (entry.author_name ?? '?').charAt(0)

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(600)}
      style={styles.wrapper}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/entry/${entry.id}`)}
        style={styles.touchable}
      >
        {layout === 'hero' && (
          <HeroLayout
            entry={entry}
            imageUrl={entry.image_url}
            time={time}
            authorLetter={authorLetter}
            isMilestone={isMilestone}
          />
        )}

        {layout === 'split' && (
          <SplitLayout
            entry={entry}
            imageUrl={entry.image_url!}
            time={time}
            authorLetter={authorLetter}
          />
        )}

        {layout === 'text' && (
          <TextLayout
            entry={entry}
            time={time}
            authorLetter={authorLetter}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Hero 模板：全宽大图 ─────────────────────────────

function HeroLayout({
  entry,
  imageUrl,
  time,
  authorLetter,
  isMilestone,
}: {
  entry: DiaryEntryWithMood
  imageUrl?: string
  time: string
  authorLetter: string
  isMilestone: boolean
}) {
  const imgWidth = SCREEN_WIDTH - spacing.sm * 2
  const imgHeight = imgWidth * 0.7

  return (
    <View style={isMilestone ? styles.milestoneWrapper : undefined}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.heroImage, { width: imgWidth, height: imgHeight }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.heroPlaceholder, { width: imgWidth, height: imgHeight }]} />
      )}

      <View style={styles.heroTextArea}>
        {isMilestone && (
          <View style={styles.milestoneBadge}>
            <Text style={styles.milestoneBadgeText}>
              {milestoneLabel(entry.milestone_type!)}
            </Text>
          </View>
        )}
        <Text style={[styles.heroDate]}>{time}</Text>
        <Text style={styles.heroAuthor}>○ {authorLetter}</Text>
      </View>

      {entry.content && (
        <Text style={styles.heroExcerpt} numberOfLines={isMilestone ? 4 : 2}>
          {entry.content}
        </Text>
      )}

      {isMilestone && (
        <View style={styles.milestoneDivider} />
      )}
    </View>
  )
}

// ─── Split 模板：左图右文 ────────────────────────────

function SplitLayout({
  entry,
  imageUrl,
  time,
  authorLetter,
}: {
  entry: DiaryEntryWithMood
  imageUrl: string
  time: string
  authorLetter: string
}) {
  const totalWidth = SCREEN_WIDTH - spacing.sm * 2
  const imgWidth = totalWidth * 0.55
  const imgHeight = imgWidth * 0.75

  return (
    <View style={styles.splitRow}>
      <Image
        source={{ uri: imageUrl }}
        style={[styles.splitImage, { width: imgWidth, height: imgHeight }]}
        resizeMode="cover"
      />
      <View style={styles.splitTextArea}>
        <Text style={styles.splitDate}>{time}</Text>
        <Text style={styles.splitAuthor}>○ {authorLetter}</Text>
        {entry.content && (
          <Text style={styles.splitExcerpt} numberOfLines={5}>
            {entry.content}
          </Text>
        )}
      </View>
    </View>
  )
}

// ─── Text 模板：纯文字摘录 ───────────────────────────

function TextLayout({
  entry,
  time,
  authorLetter,
}: {
  entry: DiaryEntryWithMood
  time: string
  authorLetter: string
}) {
  return (
    <View style={styles.textBlock}>
      <Text style={styles.textAuthor}>○ {authorLetter}</Text>
      <Text style={styles.textDate}>{time}</Text>
      {entry.content && (
        <Text style={styles.textExcerpt} numberOfLines={4}>
          {entry.content}
        </Text>
      )}
    </View>
  )
}

// ─── 工具 ────────────────────────────────────────────

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

// ─── 样式 ────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  touchable: {},
  // Hero
  heroImage: {
    borderRadius: radii.card,
    marginBottom: spacing.xs,
  },
  heroPlaceholder: {
    borderRadius: radii.card,
    marginBottom: spacing.xs,
    backgroundColor: colors.bgSecondary,
  },
  heroTextArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  heroDate: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  heroAuthor: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  heroExcerpt: {
    fontSize: fontSizes.body,
    fontFamily: fonts.sans,
    color: colors.text,
    lineHeight: lineHeights.body,
  },
  // Milestone
  milestoneWrapper: {
    paddingLeft: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
  },
  milestoneBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentLight,
    borderRadius: 4,
    paddingHorizontal: spacing.xs - 4,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  milestoneBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  milestoneDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginTop: spacing.sm,
  },
  // Split
  splitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  splitImage: {
    borderRadius: radii.card,
  },
  splitTextArea: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: spacing.xs - 8,
  },
  splitDate: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  splitAuthor: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
  },
  splitExcerpt: {
    fontSize: fontSizes.body,
    fontFamily: fonts.sans,
    color: colors.text,
    lineHeight: lineHeights.body,
  },
  // Text
  textBlock: {
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  textAuthor: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  textDate: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  textExcerpt: {
    fontSize: fontSizes.body,
    fontFamily: fonts.sans,
    color: colors.text,
    lineHeight: lineHeights.body,
  },
})
