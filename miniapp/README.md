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

It currently uses local mock data in `app.js` so the interface can be reviewed immediately in WeChat DevTools. Supabase REST configuration lives in `utils/supabase.js` and can be wired into the pages later.

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

For real login, the recommended next step is to add a backend or cloud function for WeChat `openid` login. The current email-login UI is only a placeholder for the MVP interface.
