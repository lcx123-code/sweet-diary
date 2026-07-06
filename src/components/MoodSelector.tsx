import React from 'react'
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native'
import { useMoodStore } from '../store/moodStore'
import { colors, spacing } from '../theme'

interface MoodSelectorProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
}

/**
 * 情绪选择器——纯 emoji 横排
 * 无容器、无边框、无玻璃
 * 选中时下方显示陶土色细横线
 */
export function MoodSelector({ selectedId, onSelect }: MoodSelectorProps) {
  const moods = useMoodStore((s) => s.moods)

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {moods.map((mood) => {
        const active = mood.id === selectedId
        return (
          <TouchableOpacity
            key={mood.id}
            onPress={() => onSelect(active ? null : mood.id)}
            activeOpacity={0.7}
            style={styles.item}
          >
            <Text style={[styles.emoji, active && styles.emojiActive]}>
              {mood.emoji}
            </Text>
            {active && <View style={styles.underline} />}
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  item: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: 4,
    width: 44,
  },
  emoji: {
    fontSize: 28,
    opacity: 0.6,
  },
  emojiActive: {
    fontSize: 32,
    opacity: 1,
  },
  underline: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accent,
  },
})
