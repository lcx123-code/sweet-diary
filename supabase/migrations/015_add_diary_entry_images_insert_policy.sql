-- 补充 diary_entry_images 表的 INSERT 策略
-- 允许本人为自己的日记条目关联图片

CREATE POLICY "users can insert own diary_entry_images"
  ON diary_entry_images FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM diary_entries
      WHERE id = diary_entry_images.entry_id
      AND user_id = auth.uid()
    )
  );

-- 同时确保 SELECT 策略存在（方便查看自己+伴侣的图）
CREATE POLICY IF NOT EXISTS "couple members can view diary_entry_images"
  ON diary_entry_images FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM diary_entries de
      JOIN diaries d ON d.id = de.diary_id
      JOIN couple_members cm ON cm.couple_id = d.couple_id
      WHERE de.id = diary_entry_images.entry_id
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
    )
  );
