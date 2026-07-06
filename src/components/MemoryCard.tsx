import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { ImageCollage } from './ImageCollage'
import { colors, spacing, fontSizes, fonts, lineHeights } from '../theme'
import type { DiaryEntryWithMood } from '../lib/supabase-types'

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
  const images = entry.images?.length
    ? entry.images
    : entry.image_url
      ? [{ id: entry.id, uri: entry.image_url, width: entry.image_width, height: entry.image_height }]
      : []
  const hasImage = images.length > 0

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
        {hasImage ? (
          <PhotoLayout
            entry={entry}
            images={images}
            time={time}
            authorLetter={authorLetter}
            isMilestone={isMilestone}
          />
        ) : (
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

function PhotoLayout({
  entry,
  images,
  time,
  authorLetter,
  isMilestone,
}: {
  entry: DiaryEntryWithMood
  images: NonNullable<DiaryEntryWithMood['images']>
  time: string
  authorLetter: string
  isMilestone: boolean
}) {
  return (
    <View style={isMilestone ? styles.milestoneWrapper : undefined}>
      <ImageCollage images={images} style={styles.collage} />

      <View style={styles.heroTextArea}>
        {isMilestone && (
          <View style={styles.milestoneBadge}>
            <Text style={styles.milestoneBadgeText}>
              {milestoneLabel(entry.milestone_type!)}
            </Text>
          </View>
        )}
        <Text style={[styles.heroDate]}>{time}</Text>
        {entry.mood && <Text style={styles.moodEmoji}>{entry.mood.emoji}</Text>}
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
      <View style={styles.textMetaRow}>
        <Text style={styles.textAuthor}>○ {authorLetter}</Text>
        {entry.mood && <Text style={styles.moodEmoji}>{entry.mood.emoji}</Text>}
        <Text style={styles.textDate}>{time}</Text>
      </View>
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
  collage: {
    marginBottom: spacing.xs,
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
  moodEmoji: {
    fontSize: 16,
    color: colors.textSecondary,
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
  // Text
  textBlock: {
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  textMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  },
  textAuthor: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
  },
  textDate: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  textExcerpt: {
    fontSize: fontSizes.body,
    fontFamily: fonts.sans,
    color: colors.text,
    lineHeight: lineHeights.body,
  },
})
