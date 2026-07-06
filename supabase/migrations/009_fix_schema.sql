-- 009_fix_schema.sql
-- 补全缺失的表、列、RLS 策略、索引、种子数据
-- 所有语句都是幂等的（IF NOT EXISTS / ON CONFLICT DO NOTHING）

-- ───── 1. 缺失的表 ─────────────────────────────────

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- images
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- period_logs
CREATE TABLE IF NOT EXISTS period_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE period_logs ENABLE ROW LEVEL SECURITY;

-- ───── 2. 缺失的列 ─────────────────────────────────

ALTER TABLE couples ADD COLUMN IF NOT EXISTS invite_code TEXT NOT NULL DEFAULT '';

ALTER TABLE couple_members ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);
ALTER TABLE couple_members ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE couple_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE diaries ADD COLUMN IF NOT EXISTS ai_summary TEXT;

ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS snapshot_of UUID REFERENCES diary_entries(id) ON DELETE SET NULL;
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS diff_type TEXT CHECK (diff_type IN ('create', 'edit', 'conflict'));

ALTER TABLE moods ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

ALTER TABLE diary_entry_images ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE diary_entry_images ADD COLUMN IF NOT EXISTS image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE;

ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE social_post_images ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE social_post_images ADD COLUMN IF NOT EXISTS image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE;

ALTER TABLE events ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- ───── 3. RLS 策略（幂等） ─────────────────────────

-- profiles
CREATE POLICY IF NOT EXISTS "users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- couples
CREATE POLICY IF NOT EXISTS "couple members can view couples"
  ON couples FOR SELECT USING (
    EXISTS (SELECT 1 FROM couple_members WHERE couple_id = id AND user_id = auth.uid() AND left_at IS NULL)
  );
CREATE POLICY IF NOT EXISTS "authenticated can insert couples"
  ON couples FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "authenticated can look up couples"
  ON couples FOR SELECT USING (auth.role() = 'authenticated');

-- couple_members
CREATE POLICY IF NOT EXISTS "couple members can view own memberships"
  ON couple_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "authenticated can insert couple_members"
  ON couple_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- users
CREATE POLICY IF NOT EXISTS "users_self"
  ON users FOR ALL USING (id = auth.uid());
CREATE POLICY IF NOT EXISTS "users_read_partner"
  ON users FOR SELECT USING (
    id = auth.uid()
    OR
    id IN (
      SELECT cm.user_id FROM couple_members cm
      WHERE cm.couple_id IN (
        SELECT cm2.couple_id FROM couple_members cm2
        WHERE cm2.user_id = auth.uid() AND cm2.left_at IS NULL
      )
      AND cm.user_id != auth.uid()
      AND cm.left_at IS NULL
    )
  );

-- diaries
CREATE POLICY IF NOT EXISTS "couple members can view diaries"
  ON diaries FOR SELECT USING (
    EXISTS (SELECT 1 FROM couple_members WHERE couple_id = diaries.couple_id AND user_id = auth.uid() AND left_at IS NULL)
  );
CREATE POLICY IF NOT EXISTS "couple members can insert diaries"
  ON diaries FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM couple_members WHERE couple_id = diaries.couple_id AND user_id = auth.uid() AND left_at IS NULL)
  );

-- diary_entries
CREATE POLICY IF NOT EXISTS "couple members can view diary_entries"
  ON diary_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM diaries d JOIN couple_members cm ON cm.couple_id = d.couple_id WHERE d.id = diary_entries.diary_id AND cm.user_id = auth.uid() AND cm.left_at IS NULL)
  );
CREATE POLICY IF NOT EXISTS "users can insert own diary_entries"
  ON diary_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "users can update own diary_entries"
  ON diary_entries FOR UPDATE USING (user_id = auth.uid());

-- moods
CREATE POLICY IF NOT EXISTS "everyone can view moods"
  ON moods FOR SELECT USING (true);

-- images
CREATE POLICY IF NOT EXISTS "users can view own images"
  ON images FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "users can insert own images"
  ON images FOR INSERT WITH CHECK (user_id = auth.uid());

-- diary_entry_images
CREATE POLICY IF NOT EXISTS "couple members can view diary_entry_images"
  ON diary_entry_images FOR SELECT USING (
    EXISTS (SELECT 1 FROM diary_entries de JOIN diaries d ON d.id = de.diary_id JOIN couple_members cm ON cm.couple_id = d.couple_id WHERE de.id = diary_entry_images.entry_id AND cm.user_id = auth.uid() AND cm.left_at IS NULL)
  );

-- social_posts
CREATE POLICY IF NOT EXISTS "couple members can view social_posts"
  ON social_posts FOR SELECT USING (
    EXISTS (SELECT 1 FROM couple_members WHERE couple_id = social_posts.couple_id AND user_id = auth.uid() AND left_at IS NULL)
  );
CREATE POLICY IF NOT EXISTS "users can insert own social_posts"
  ON social_posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "users can update own social_posts"
  ON social_posts FOR UPDATE USING (user_id = auth.uid());

-- social_likes
CREATE POLICY IF NOT EXISTS "couple members can view social_likes"
  ON social_likes FOR SELECT USING (
    EXISTS (SELECT 1 FROM social_posts sp JOIN couple_members cm ON cm.couple_id = sp.couple_id WHERE sp.id = social_likes.post_id AND cm.user_id = auth.uid() AND cm.left_at IS NULL)
  );
CREATE POLICY IF NOT EXISTS "users can insert own social_likes"
  ON social_likes FOR INSERT WITH CHECK (user_id = auth.uid());

-- events
CREATE POLICY IF NOT EXISTS "couple members can view events"
  ON events FOR SELECT USING (
    EXISTS (SELECT 1 FROM couple_members WHERE couple_id = events.couple_id AND user_id = auth.uid() AND left_at IS NULL)
  );
CREATE POLICY IF NOT EXISTS "couple members can insert events"
  ON events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM couple_members WHERE couple_id = events.couple_id AND user_id = auth.uid() AND left_at IS NULL)
  );

-- period_logs
CREATE POLICY IF NOT EXISTS "users can view own period_logs"
  ON period_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "users can insert own period_logs"
  ON period_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "users can update own period_logs"
  ON period_logs FOR UPDATE USING (user_id = auth.uid());

-- social_post_images
CREATE POLICY IF NOT EXISTS "couple members can view social_post_images"
  ON social_post_images FOR SELECT USING (
    EXISTS (SELECT 1 FROM social_posts sp JOIN couple_members cm ON cm.couple_id = sp.couple_id WHERE sp.id = social_post_images.post_id AND cm.user_id = auth.uid() AND cm.left_at IS NULL)
  );

-- ───── 4. 种子数据 ─────────────────────────────────

INSERT INTO moods (emoji, label, sort_order) VALUES
  ('😊', '开心', 1),
  ('😌', '平静', 2),
  ('😢', '难过', 3),
  ('😡', '生气', 4),
  ('😰', '焦虑', 5),
  ('😴', '疲惫', 6),
  ('🥰', '甜蜜', 7),
  ('🤗', '感恩', 8),
  ('😐', '一般', 9),
  ('🤔', '纠结', 10)
ON CONFLICT DO NOTHING;

-- ───── 5. 索引 ─────────────────────────────────----

CREATE INDEX IF NOT EXISTS idx_couple_members_user_id ON couple_members(user_id);
CREATE INDEX IF NOT EXISTS idx_couple_members_couple_id ON couple_members(couple_id);
CREATE INDEX IF NOT EXISTS idx_diaries_couple_date ON diaries(couple_id, date);
CREATE INDEX IF NOT EXISTS idx_diary_entries_diary_id ON diary_entries(diary_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_couple_id ON social_posts(couple_id);
CREATE INDEX IF NOT EXISTS idx_events_couple_date ON events(couple_id, event_date);
CREATE INDEX IF NOT EXISTS idx_period_logs_user_id ON period_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);

-- ───── 6. Auth 触发器 ─────────────────────────────

-- 用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 用户更新 email 时同步到 existing auth 用户
CREATE OR REPLACE FUNCTION handle_update_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE auth.users SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 用户删除时清理关联数据
CREATE OR REPLACE FUNCTION handle_delete_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_delete_user();
