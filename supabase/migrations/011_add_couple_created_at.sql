-- Together Journal: 追加 created_at 到 couples 表
-- 用于首页 "在一起 X 天" 计算

ALTER TABLE couples ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 现有记录用第一条日记日期回填
UPDATE couples c
SET created_at = sub.first_date
FROM (
  SELECT d.couple_id, MIN(d.date) AS first_date
  FROM diaries d
  GROUP BY d.couple_id
) sub
WHERE c.id = sub.couple_id
  AND c.created_at IS DISTINCT FROM sub.first_date;
