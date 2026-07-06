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
import { supabase } from '../../src/lib/supabase'
import { colors, spacing, fontSizes, fonts, lineHeights } from '../../src/theme'
import type { DiaryEntryWithMood, Image as ImageType } from '../../src/lib/supabase-types'

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [entry, setEntry] = useState<DiaryEntryWithMood | null>(null)
  const [images, setImages] = useState<{ id: string; uri: string; width?: number; height?: number }[]>([])
  const [loading, setLoading] = useState(true)
  const getEntry = useDiaryStore((s) => s.getEntry)

  useEffect(() => {
    if (!id) return
    setLoading(true)

    Promise.all([
      getEntry(id),
      fetchImages(id),
    ]).then(([entryData]) => {
      setEntry(entryData)
      setLoading(false)
    })
  }, [id])

  const fetchImages = async (entryId: string) => {
    const { data, error } = await supabase
      .from('diary_entry_images')
      .select('image_id, images(bucket, path, width, height)')
      .eq('entry_id', entryId)

    if (error || !data) return

    const urls: { id: string; uri: string; width?: number; height?: number }[] = []
    for (const row of data) {
      const img = Array.isArray(row.images) ? row.images[0] : row.images as unknown as ImageType
      if (!img?.bucket || !img?.path) continue

      const { data: urlData } = supabase.storage
        .from(img.bucket)
        .getPublicUrl(img.path)

      urls.push({
        id: row.image_id,
        uri: urlData.publicUrl,
        width: img.width ?? undefined,
        height: img.height ?? undefined,
      })
    }

    setImages(urls)
  }

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

  const time = new Date(entry.created_at).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const date = new Date(entry.created_at)
  const dateStr = `${date.getMonth() + 1}.${date.getDate()}`
  const avatarLetter = (entry.author_name ?? '?').charAt(0)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 返回 */}
      <Text style={styles.back} onPress={() => router.back()}>
        返回
      </Text>

      {/* 日期 */}
      <Text style={styles.dateHeader}>{dateStr}</Text>

      {/* 作者标识—小圆点 */}
      <View style={styles.authorRow}>
        <View style={styles.authorDot}>
          <Text style={styles.authorDotText}>{avatarLetter}</Text>
        </View>
        <Text style={styles.authorName}>{entry.author_name ?? '用户'}</Text>
        <Text style={styles.authorTime}>· {time}</Text>
        {entry.mood && (
          <Text style={styles.moodEmoji}>{entry.mood.emoji}</Text>
        )}
      </View>

      {/* 正文 */}
      {entry.content && (
        <Text style={styles.contentText}>{entry.content}</Text>
      )}

      {/* 图片 */}
      {images.length > 0 && (
        <ImageCollage images={images} style={styles.imageSection} />
      )}

      {/* 里程碑标记 */}
      {entry.milestone_type && (
        <View style={styles.milestoneBadge}>
          <Text style={styles.milestoneBadgeText}>
            {milestoneLabel(entry.milestone_type)}
          </Text>
        </View>
      )}
    </ScrollView>
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
