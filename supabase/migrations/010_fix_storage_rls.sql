-- 010_fix_storage_rls.sql
-- 修复 images 表 + diary_entry_images 表 + Storage bucket 的 RLS 策略

-- ───── 1. images 表 RLS ─────────────────────────────

-- 确保 RLS 开启
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- 删掉可能残留的错误策略
DROP POLICY IF EXISTS "用户插入自己的图片" ON images;
DROP POLICY IF EXISTS "伴侣查看图片" ON images;
DROP POLICY IF EXISTS "users can insert own images" ON images;
DROP POLICY IF EXISTS "users can view own images" ON images;

-- 重新创建 INSERT 策略
CREATE POLICY "users_can_insert_own_images"
  ON images FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 重新创建 SELECT 策略（自己 + 伴侣的图片）
CREATE POLICY "users_can_view_couple_images"
  ON images FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    user_id IN (
      SELECT cm.user_id FROM couple_members cm
      WHERE cm.couple_id IN (
        SELECT cm2.couple_id FROM couple_members cm2
        WHERE cm2.user_id = auth.uid() AND cm2.left_at IS NULL
      )
      AND cm.user_id != auth.uid()
      AND cm.left_at IS NULL
    )
  );

-- ───── 2. diary_entry_images 表 RLS ─────────────────

ALTER TABLE diary_entry_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_insert_diary_entry_images" ON diary_entry_images;
DROP POLICY IF EXISTS "users_can_view_diary_entry_images" ON diary_entry_images;

CREATE POLICY "users_can_insert_diary_entry_images"
  ON diary_entry_images FOR INSERT
  WITH CHECK (
    entry_id IN (
      SELECT id FROM diary_entries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_view_diary_entry_images"
  ON diary_entry_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diary_entries de
      JOIN diaries d ON d.id = de.diary_id
      JOIN couple_members cm ON cm.couple_id = d.couple_id
      WHERE de.id = diary_entry_images.entry_id
        AND cm.user_id = auth.uid()
        AND cm.left_at IS NULL
    )
  );

-- ───── 3. Storage bucket RLS ─────────────────────────

DROP POLICY IF EXISTS "允许用户上传图片" ON storage.objects;
DROP POLICY IF EXISTS "任何人都可查看图片" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON storage.objects;

CREATE POLICY "storage_allow_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'diary-images');

CREATE POLICY "storage_allow_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'diary-images');
