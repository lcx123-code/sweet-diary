-- Together Journal: 里程碑标记
-- 用于重要记忆自动放大展示

ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS milestone_type TEXT DEFAULT NULL;

-- 取值约束
-- 'first_trip' | 'anniversary' | 'birthday' | 'move_in' | 'proposal' | 'other'
