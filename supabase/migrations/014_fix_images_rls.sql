-- Together Journal: 修复 images 表 RLS
-- 允许伴侣双方查看对方的照片

-- 删除旧的仅限自己查看的策略
DROP POLICY IF EXISTS "users can view own images" ON images;

-- 新策略：自己和伴侣都可以查看
CREATE POLICY "couple members can view images"
  ON images FOR SELECT USING (
    -- 自己的照片
    user_id = auth.uid()
    OR
    -- 伴侣的照片（通过情侣关系）
    EXISTS (
      SELECT 1 FROM couple_members cm
      WHERE cm.couple_id IN (
        SELECT cm2.couple_id FROM couple_members cm2
        WHERE cm2.user_id = auth.uid() AND cm2.left_at IS NULL
      )
      AND cm.user_id = images.user_id
      AND cm.left_at IS NULL
    )
  );

-- 插入策略不变（用户只能上传自己的照片）
CREATE POLICY "users can insert own images"
  ON images FOR INSERT WITH CHECK (user_id = auth.uid());
