import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeChatSession {
  openid?: string
  unionid?: string
  session_key?: string
  errcode?: number
  errmsg?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()
    if (!code) throw new Error('缺少微信登录 code')

    const appid = mustGetEnv('WECHAT_APPID')
    const secret = mustGetEnv('WECHAT_SECRET')
    const supabaseUrl = mustGetEnv('SUPABASE_URL')
    const serviceRoleKey = mustGetEnv('SUPABASE_SERVICE_ROLE_KEY')
    const jwtSecret = mustGetEnv('SUPABASE_JWT_SECRET')

    const wxRes = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`,
    )
    const wxSession = await wxRes.json() as WeChatSession

    if (!wxSession.openid) {
      throw new Error(wxSession.errmsg || '微信登录失败')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    let userId = await findMappedUserId(supabase, wxSession.openid)

    if (!userId) {
      const email = `wx_${wxSession.openid}@sweet-diary.local`
      const password = crypto.randomUUID() + crypto.randomUUID()
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: '微信用户', provider: 'wechat' },
      })
      if (error || !data.user) throw error || new Error('创建用户失败')

      userId = data.user.id

      await supabase
        .from('profiles')
        .upsert({ id: userId, name: '微信用户' })

      const { error: mapError } = await supabase
        .from('wechat_identities')
        .insert({
          openid: wxSession.openid,
          unionid: wxSession.unionid ?? null,
          user_id: userId,
        })
      if (mapError) throw mapError
    }

    const token = await signSupabaseJwt(jwtSecret, {
      sub: userId,
      aud: 'authenticated',
      role: 'authenticated',
      iss: 'supabase',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    })

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', userId)
      .maybeSingle()

    return json({
      access_token: token,
      token_type: 'bearer',
      expires_in: 60 * 60 * 24 * 7,
      user: {
        id: userId,
        email: `wx_${wxSession.openid}@sweet-diary.local`,
        user_metadata: { name: profile?.name || '微信用户' },
      },
    })
  } catch (error) {
    return json({ message: error.message || '微信登录失败' }, 400)
  }
})

async function findMappedUserId(supabase: ReturnType<typeof createClient>, openid: string) {
  const { data, error } = await supabase
    .from('wechat_identities')
    .select('user_id')
    .eq('openid', openid)
    .maybeSingle()

  if (error) throw error
  return data?.user_id as string | undefined
}

function mustGetEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`缺少环境变量 ${name}`)
  return value
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

async function signSupabaseJwt(secret: string, payload: Record<string, unknown>) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const data = `${encodedHeader}.${encodedPayload}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return `${data}.${base64UrlEncode(signature)}`
}

function base64UrlEncode(value: string | ArrayBuffer) {
  const bytes = typeof value === 'string'
    ? new TextEncoder().encode(value)
    : new Uint8Array(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}
