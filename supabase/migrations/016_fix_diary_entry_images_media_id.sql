-- 修复 diary_entry_images 表的媒体 ID 关联
-- 此表原本使用 media_id 作为 FK → media 表，
-- 但我们使用 image_id → images 表。
-- 去除 media_id 外键约束、主键重组，使 image_id 成为主键一部分。

-- 1) 删除 media_id 外键约束
ALTER TABLE diary_entry_images DROP CONSTRAINT IF EXISTS diary_entry_images_media_id_fkey;

-- 2) 删除旧主键（包含 media_id）
ALTER TABLE diary_entry_images DROP CONSTRAINT IF EXISTS diary_entry_images_pkey;

-- 3) 使 media_id 可为空
ALTER TABLE diary_entry_images ALTER COLUMN media_id DROP NOT NULL;

-- 4) 重建主键使用 entry_id + image_id
ALTER TABLE diary_entry_images ADD PRIMARY KEY (entry_id, image_id);
