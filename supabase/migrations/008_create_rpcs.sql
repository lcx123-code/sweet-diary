-- create_couple: 原子创建伴侣关系
CREATE OR REPLACE FUNCTION create_couple(_user_id UUID)
RETURNS TABLE (couple_id UUID, invite_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_couple_id UUID;
  v_invite_code TEXT;
BEGIN
  -- 检查是否已有 active 伴侣
  IF EXISTS (
    SELECT 1 FROM couple_members
    WHERE user_id = _user_id AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION '用户已在一个伴侣关系中';
  END IF;

  -- 生成 6 位邀请码
  v_invite_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  -- 创建 couple
  INSERT INTO couples (invite_code)
  VALUES (v_invite_code)
  RETURNING id INTO v_couple_id;

  -- 注意：触发器 on_couple_created 会自动在 couple_members 插入一行（role = 'owner'）
  -- 这里设置创建者的 confirmed_at，等同于创建者自动确认
  UPDATE couple_members
  SET confirmed_at = NOW()
  WHERE couple_members.couple_id = v_couple_id AND couple_members.user_id = _user_id;

  couple_id := v_couple_id;
  invite_code := v_invite_code;
  RETURN NEXT;
END;
$$;

-- confirm_partner: 确认伴侣（确认自己，同时检查对方是否已确认）
CREATE OR REPLACE FUNCTION confirm_partner(_user_id UUID)
RETURNS TABLE (status TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_couple_id UUID;
  v_partner_confirmed BOOLEAN;
BEGIN
  -- 找当前 active 会员
  SELECT couple_id INTO v_couple_id
  FROM couple_members
  WHERE user_id = _user_id AND left_at IS NULL;

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION '未找到伴侣关系';
  END IF;

  -- 确认自己
  UPDATE couple_members
  SET confirmed_at = NOW()
  WHERE couple_id = v_couple_id AND user_id = _user_id AND left_at IS NULL;

  -- 检查对方状态
  SELECT EXISTS (
    SELECT 1 FROM couple_members
    WHERE couple_id = v_couple_id AND user_id != _user_id
      AND left_at IS NULL AND confirmed_at IS NOT NULL
  ) INTO v_partner_confirmed;

  IF v_partner_confirmed THEN
    status := 'active';
  ELSE
    status := 'pending';
  END IF;
  RETURN NEXT;
END;
$$;

-- get_partner_info: 用 SECURITY DEFINER 查伴侣信息，绕过 RLS 递归
CREATE OR REPLACE FUNCTION get_partner_info(p_user_id UUID)
RETURNS TABLE (partner_id UUID, partner_name TEXT, partner_confirmed BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT cm.user_id, u.name, cm.confirmed_at IS NOT NULL
  FROM couple_members cm
  JOIN users u ON u.id = cm.user_id
  WHERE cm.couple_id IN (
    SELECT cm2.couple_id FROM couple_members cm2
    WHERE cm2.user_id = p_user_id AND cm2.left_at IS NULL
  )
  AND cm.user_id != p_user_id
  AND cm.left_at IS NULL;
END;
$$;
