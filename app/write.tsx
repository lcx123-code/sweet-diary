import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { Ionicons } from '@expo/vector-icons'
import { MoodSelector } from '../src/components/MoodSelector'
import { useAuthStore } from '../src/store/authStore'
import { useCoupleStore } from '../src/store/coupleStore'
import { useMoodStore } from '../src/store/moodStore'
import { useDiaryStore } from '../src/store/diaryStore'
import { supabase } from '../src/lib/supabase'
import { colors, spacing, fontSizes, fonts, lineHeights, radii } from '../src/theme'

const recordTypes = [
  { label: '普通记录', value: null },
  { label: '纪念日', value: 'anniversary' },
  { label: '旅行', value: 'first_trip' },
  { label: '生日', value: 'birthday' },
  { label: '特别时刻', value: 'other' },
] as const

export default function WriteScreen() {
  const { diaryId } = useLocalSearchParams<{ diaryId?: string }>()
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([])
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [milestoneType, setMilestoneType] = useState<string | null>(null)

  const user = useAuthStore((s) => s.user)
  const coupleId = useCoupleStore((s) => s.coupleId)
  const selectedMood = useMoodStore((s) => s.selectedId)
  const moods = useMoodStore((s) => s.moods)
  const selectMood = useMoodStore((s) => s.selectMood)
  const fetchMoods = useMoodStore((s) => s.fetchMoods)
  const createEntry = useDiaryStore((s) => s.createEntry)

  useEffect(() => {
    fetchMoods()
  }, [])

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('需要权限', '请允许访问相册')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 3 - images.length,
    })

    if (!result.canceled && result.assets.length > 0) {
      setImages((prev) => [...prev, ...result.assets].slice(0, 3))
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImage = async (asset: ImagePicker.ImagePickerAsset, userId: string): Promise<string | null> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      const ext = (asset.fileName ?? asset.uri).split('.').pop()?.split('?')[0] ?? 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('diary-images')
        .upload(path, decode(base64), { contentType: `image/${ext}` })

      if (uploadError) {
        console.warn('[upload] storage error:', uploadError)
        return null
      }

      const { data: img, error: insertError } = await supabase
        .from('images')
        .insert({
          user_id: userId,
          bucket: 'diary-images',
          path,
          width: asset.width ?? null,
          height: asset.height ?? null,
        })
        .select('id')
        .single()

      if (insertError) {
        console.warn('[upload] insert error:', insertError)
        return null
      }

      return img?.id ?? null

    } catch (e) {
      console.warn('[upload] exception:', e)
      return null
    }
  }

  const handleSave = async () => {
    if (!user || !coupleId) return
    if (!content.trim()) {
      Alert.alert('提示', '写点什么吧')
      return
    }

    setSaving(true)

    const { id: entryId, error } = await createEntry(
      coupleId,
      user.id,
      content.trim(),
      selectedMood,
      milestoneType,
    )
    if (error || !entryId) {
      setSaving(false)
      Alert.alert('保存失败', error ?? '未知错误')
      return
    }

    for (const asset of images) {
      const imageId = await uploadImage(asset, user.id)
      if (imageId) {
        const { error: linkError } = await supabase.from('diary_entry_images').insert({
          entry_id: entryId,
          image_id: imageId,
          media_id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16) }),
        })
        if (linkError) {
          console.warn('[diary_entry_images] insert error:', linkError)
        }
      }
    }

    setSaving(false)
    router.back()
  }

  const today = new Date()
  const dateStr = `${today.getMonth() + 1}.${today.getDate()}`
  const selectedMoodEmoji = moods.find((mood) => mood.id === selectedMood)?.emoji

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 顶部栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.publishText, saving && styles.publishDisabled]}>
            {saving ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 编辑区 */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* 日期 */}
        <Text style={styles.dateHeader}>{dateStr}</Text>

        {/* 文字输入 */}
        <TextInput
          style={styles.input}
          placeholder="写点今天的事..."
          placeholderTextColor={colors.textMuted}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          autoFocus
        />

        {/* 图片预览 */}
        {images.length > 0 && (
          <View style={styles.imageRow}>
            {images.map((asset, i) => (
              <View key={asset.uri} style={styles.imageWrapper}>
                <Image source={{ uri: asset.uri }} style={styles.thumbnail} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeImage(i)}
                >
                  <Ionicons name="close-circle" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 分隔线 */}
        <View style={styles.divider} />

        <View style={styles.typeSection}>
          {recordTypes.map((type) => {
            const active = milestoneType === type.value
            return (
              <TouchableOpacity
                key={type.label}
                style={[styles.typePill, active && styles.typePillActive]}
                onPress={() => setMilestoneType(type.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.typeText, active && styles.typeTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* 心情选择器（点击 😊 后展开） */}
        {showMoodPicker && (
          <View style={styles.moodRow}>
            <MoodSelector
              selectedId={selectedMood}
              onSelect={(id) => {
                selectMood(id)
              }}
            />
          </View>
        )}
      </ScrollView>

      {/* 底部工具栏 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={pickImage}
          disabled={images.length >= 3}
        >
          <Ionicons
            name="camera-outline"
            size={22}
            color={images.length >= 3 ? colors.textMuted : colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, selectedMood && styles.toolBtnActive]}
          onPress={() => setShowMoodPicker(!showMoodPicker)}
        >
          <Text style={[styles.moodBtnText, selectedMood && styles.moodBtnTextActive]}>
            {selectedMoodEmoji ?? '😊'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingTop: Platform.OS === 'ios' ? 56 : spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.bg,
  },
  backText: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  publishText: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.accent,
  },
  publishDisabled: {
    opacity: 0.5,
  },
  scroll: {
    padding: spacing.sm,
    paddingTop: spacing.xs,
    flexGrow: 1,
  },
  dateHeader: {
    fontSize: fontSizes.dateTitle,
    fontFamily: fonts.serif,
    color: colors.text,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  input: {
    fontSize: fontSizes.body,
    fontFamily: fonts.sans,
    color: colors.text,
    lineHeight: lineHeights.body,
    minHeight: 200,
    padding: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginVertical: spacing.sm,
  },
  typeSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  typePill: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 8,
    backgroundColor: colors.bgSecondary,
  },
  typePillActive: {
    backgroundColor: colors.accentLight,
  },
  typeText: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  typeTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  imageWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: 100,
    height: 80,
    borderRadius: radii.card,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.white,
    borderRadius: 11,
  },
  moodRow: {
    paddingVertical: spacing.xs,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    backgroundColor: colors.bg,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  toolBtnActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  moodBtnText: {
    fontSize: 20,
  },
  moodBtnTextActive: {
    fontSize: 24,
  },
})
