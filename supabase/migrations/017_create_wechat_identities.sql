-- Map WeChat openid values to Supabase auth users.
-- Used by the Mini Program wechat-login Edge Function.

CREATE TABLE IF NOT EXISTS wechat_identities (
  openid TEXT PRIMARY KEY,
  unionid TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE wechat_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users can view own wechat identity"
  ON wechat_identities FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wechat_identities_user_id
  ON wechat_identities(user_id);
