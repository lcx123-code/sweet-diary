# Sweet Diary Mini Program

This folder contains a native WeChat Mini Program version of Sweet Diary.

The first version focuses on preserving the current paper-editorial UI:

- Today cover page
- Write page
- Timeline page
- Shared day detail page
- Login and invite-code screens
- Multi-image collage styling
- Mood and milestone UI

It uses the existing Supabase project through REST APIs in `utils/supabase.js`.

Implemented now:

- WeChat one-tap login through `wx.login()` + Supabase Edge Function
- Email/password login through Supabase Auth
- Session token storage in WeChat local storage
- Loading profile, couple, partner, moods, diaries, entries, and entry images
- Creating text journal entries in the existing `diaries` / `diary_entries` tables
- Uploading images to Supabase Storage and linking them to diary entries

Still pending:

- Invite-code create/join actions

## Open In WeChat DevTools

1. Open WeChat DevTools.
2. Choose "Import Project".
3. Select this folder:

```text
C:\Users\jack\Desktop\sweet-diary\miniapp
```

4. Use a test AppID or your real Mini Program AppID.

## Before Release

Configure request domains in the WeChat Mini Program console:

```text
https://ialmdeggizzddhkcqsfl.supabase.co
```

For a better Mini Program login experience, the recommended next step is to add a backend or cloud function for WeChat `openid` login. Email login is already wired for the current MVP.

## WeChat Login Edge Function

Deploy the function:

```bash
supabase functions deploy wechat-login
```

Set secrets:

```bash
supabase secrets set WECHAT_APPID=你的微信小程序AppID
supabase secrets set WECHAT_SECRET=你的微信小程序AppSecret
supabase secrets set SUPABASE_JWT_SECRET=你的Supabase JWT Secret
```

The function also uses the standard Supabase function secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Run migration `017_create_wechat_identities.sql` before using WeChat login.
