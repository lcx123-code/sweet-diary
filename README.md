# Sweet Diary

Sweet Diary is a private shared journal for two people. It is not a chat app, a social feed, or a couple check-in tool. The core idea is simple: write life down as easily as a note, then revisit it later like a quiet memory book.

## Product Direction

- Two people share one daily journal space.
- Writing should feel light, low-pressure, and private.
- Reading should feel like turning pages in a calm photo-and-text diary.
- The interface avoids chat bubbles, social reactions, bright pink, gradients, glass effects, and heavy cards.

## Current Features

- Email registration and login
- Six-character invite code pairing
- Two-person confirmation flow
- Daily journal entries
- Photo upload through Supabase Storage
- Multi-image collage display
- Mood selection with live feedback
- Milestone labels such as anniversary, trip, birthday, and special moment
- Home view with relationship cover, today status, and recent memories
- Timeline view grouped by year and month
- Entry detail page with full text and image collage

## Tech Stack

- Expo + React Native
- TypeScript
- Expo Router
- Zustand
- Supabase Auth, PostgreSQL, and Storage
- Noto Serif SC for date and title typography

## Design System

- Background: `#FAF8F5`
- Secondary background: `#F2EEE8`
- Text: `#2B2B2B`
- Secondary text: `#7C756D`
- Accent: `#A8B8A5`
- Separator: `#E8E4DE`

The visual language is paper editorial: warm, quiet, photo-first, minimal, and long-lived.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npx expo start --lan --clear
```

For web preview:

```bash
npx expo start --web
```

Type-check:

```bash
npx tsc --noEmit
```

Build static web output:

```bash
npx expo export --platform web --clear
```

## Supabase Notes

The app expects the Supabase schema in `supabase/migrations` to be applied. The main tables are:

- `couples`
- `couple_members`
- `diaries`
- `diary_entries`
- `moods`
- `images`
- `diary_entry_images`
- `wechat_identities`

Local Supabase metadata under `supabase/.temp/` is intentionally ignored.

The WeChat Mini Program login flow uses the `supabase/functions/wechat-login` Edge Function. It exchanges `wx.login()` codes for WeChat `openid`, maps that `openid` to a Supabase auth user, and returns a Supabase-compatible JWT for Mini Program REST requests.

## Roadmap

- Show real profile names instead of temporary user-id based author labels
- Merge same-day entries into a more continuous shared page
- Add draft/autosave behavior
- Improve image upload progress feedback
- Add AI memory summaries later, after the core writing and reading experience feels right
