-- Together Journal: 图片原始尺寸
-- 用于图片按原始比例显示

ALTER TABLE images ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE images ADD COLUMN IF NOT EXISTS height INTEGER;
