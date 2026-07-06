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

- Email/password login through Supabase Auth
- Session token storage in WeChat local storage
- Loading profile, couple, partner, moods, diaries, entries, and entry images
- Creating text journal entries in the existing `diaries` / `diary_entries` tables

Still pending:

- Real WeChat `openid` login
- Image upload from Mini Program to Supabase Storage
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
