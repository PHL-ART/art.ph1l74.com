# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a protected admin dashboard at `/admin/dashboard` — calendar of publications, cross-posting panel, archive, and a server action that publishes a post to the public site.

**Architecture:** Next.js 14 App Router with GitHub OAuth (next-auth v4) guarding all `/admin/*` routes. Client state (current month, selected post, channel toggles) lives in an RTK slice persisted to localStorage via redux-persist. Post data is fetched client-side from `/api/admin/posts`. Publishing is a Server Action that flips `status → PUBLISHED` and runs `revalidatePath`.

**Tech Stack:** next-auth@4, @reduxjs/toolkit, react-redux, redux-persist, Prisma 7 + pg adapter (existing), Vitest + jsdom (existing test runner).

## Global Constraints

- `'use client'` required on any component using hooks or event handlers
- Tailwind + CSS custom properties for styling (no hardcoded colours except admin-only dark values)
- Admin is **dark-theme only** — `data-theme="dark"` fixed in layout, no toggle
- Font classes: `font-display` (Manrope 700), `font-nav` (Montserrat 600-700), `font-body` (Jost 300)
- Prisma client imported from `@/shared/lib/prisma`; generated types from `../../generated/prisma`
- `@` alias maps to `src/`
- Tests: `vitest run` — all must pass before each commit
- Logo: `/logo-white.svg` (dark background), `/logo-black.svg` (light background)
- S3 cover image URL: `${process.env.NEXT_PUBLIC_S3_BASE_URL}/${coverImageKey}`

---

## File Map

| File | Action |
|---|---|
| `prisma/schema.prisma` | Modify — add `scheduledAt DateTime?` to Post |
| `src/lib/auth.ts` | Create — NextAuth config |
| `src/middleware.ts` | Create — protect /admin/* |
| `src/app/api/auth/[...nextauth]/route.ts` | Create — NextAuth handler |
| `src/shared/store/index.ts` | Create — Redux store + persist |
| `src/shared/store/provider.tsx` | Create — ReduxProvider + PersistGate |
| `src/features/admin/types.ts` | Create — AdminPost type |
| `src/features/admin/queries.ts` | Create — Prisma queries for dashboard |
| `src/features/admin/lib/buildCalendarDays.ts` | Create — pure calendar grid helper |
| `src/features/admin/lib/__tests__/buildCalendarDays.test.ts` | Create — unit tests |
| `src/features/admin/model/adminSlice.ts` | Create — RTK slice |
| `src/features/admin/model/__tests__/adminSlice.test.ts` | Create — unit tests |
| `src/features/admin/actions/publishPost.ts` | Create — Server Action |
| `src/features/admin/ui/AdminSidebar.tsx` | Create — icon sidebar (desktop only) |
| `src/features/admin/ui/AdminTopbar.tsx` | Create — topbar + mobile tabs |
| `src/features/admin/ui/AdminBottomNav.tsx` | Create — bottom nav (mobile only) |
| `src/features/admin/ui/AdminCalendar.tsx` | Create — calendar grid |
| `src/features/admin/ui/AdminAgenda.tsx` | Create — upcoming posts list (mobile only) |
| `src/features/admin/ui/CrossPostingPanel.tsx` | Create — selected post + channel toggles |
| `src/features/admin/ui/AdminArchive.tsx` | Create — archive table/list |
| `src/features/admin/ui/AdminDashboard.tsx` | Create — client orchestrator |
| `src/app/api/admin/posts/route.ts` | Create — protected API route |
| `src/app/(admin)/layout.tsx` | Modify — add ReduxProvider, fix dark theme |
| `src/app/(admin)/login/page.tsx` | Modify — real login UI with GitHub button |
| `src/app/(admin)/dashboard/page.tsx` | Create — thin server component |
| `.env` | Modify — add NEXT_PUBLIC_S3_BASE_URL |

---

## Task 1: Dependencies + Prisma migration

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260628_add_scheduled_at/migration.sql` (auto-generated)
- Modify: `.env`

**Interfaces:**
- Produces: `Post.scheduledAt: DateTime?` in Prisma schema and generated client

- [ ] **Step 1: Install packages**

```bash
npm install next-auth @reduxjs/toolkit react-redux redux-persist
npm install --save-dev @types/redux-persist
```

Expected: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Add `scheduledAt` to schema**

In `prisma/schema.prisma`, after `publishedAt DateTime?` on the Post model:

```prisma
model Post {
  id            String       @id @default(cuid())
  title         String
  slug          String       @unique
  body          Json
  coverImageKey String?
  isFeatured    Boolean      @default(false)
  status        PostStatus   @default(DRAFT)
  publishedAt   DateTime?
  scheduledAt   DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  categories    Category[]   @relation("PostCategories")
  tags          Tag[]        @relation("PostTags")
  socialLinks   SocialLink[]
}
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name add_scheduled_at
```

Expected output: `The following migration(s) have been created and applied: migrations/20260628_add_scheduled_at`

- [ ] **Step 4: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client` in output.

- [ ] **Step 5: Add env variable**

In `.env`, add:
```
# Base URL for S3 cover images (used client-side in admin)
NEXT_PUBLIC_S3_BASE_URL=https://s3.firstvds.ru/phlart
```

Replace `s3.firstvds.ru/phlart` with the actual endpoint+bucket combination from `S3_ENDPOINT`/`S3_BUCKET` in your `.env`.

- [ ] **Step 6: Verify tests still pass**

```bash
npm test
```

Expected: all existing tests pass.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/generated/ package.json package-lock.json .env
git commit -m "feat: add scheduledAt to Post, install auth/redux deps"
```

---

## Task 2: AdminPost type + Prisma queries + buildCalendarDays helper

**Files:**
- Create: `src/features/admin/types.ts`
- Create: `src/features/admin/queries.ts`
- Create: `src/features/admin/lib/buildCalendarDays.ts`
- Create: `src/features/admin/lib/__tests__/buildCalendarDays.test.ts`

**Interfaces:**
- Produces: `AdminPost` type — used by all admin UI components
- Produces: `getCalendarPosts(year, month) → AdminPost[]`
- Produces: `getArchivePosts() → AdminPost[]`
- Produces: `buildCalendarDays(year, month, posts) → CalendarDay[]`

- [ ] **Step 1: Write the failing test for buildCalendarDays**

Create `src/features/admin/lib/__tests__/buildCalendarDays.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildCalendarDays } from '../buildCalendarDays'
import type { AdminPost } from '../../types'

function makePost(overrides: Partial<AdminPost> = {}): AdminPost {
  return {
    id: 'p1',
    title: 'тест',
    slug: 'test',
    status: 'SCHEDULED',
    scheduledAt: '2026-06-15T12:00:00.000Z',
    publishedAt: null,
    coverImageKey: null,
    categories: [],
    ...overrides,
  }
}

describe('buildCalendarDays', () => {
  it('возвращает длину кратную 7', () => {
    const days = buildCalendarDays(2026, 6, [])
    expect(days.length % 7).toBe(0)
    expect(days.length).toBeGreaterThanOrEqual(28)
  })

  it('июнь 2026 начинается с понедельника — нет отступа', () => {
    const days = buildCalendarDays(2026, 6, [])
    expect(days[0]).toMatchObject({ num: 1, isCurrentMonth: true })
  })

  it('январь 2026 начинается с четверга — 3 дня отступа', () => {
    const days = buildCalendarDays(2026, 1, [])
    // пн=1, вт=1, ср=1 → три dim дня (29,30,31 декабря)
    expect(days[0]).toMatchObject({ isCurrentMonth: false })
    expect(days[3]).toMatchObject({ num: 1, isCurrentMonth: true })
  })

  it('SCHEDULED пост размещается по scheduledAt', () => {
    const post = makePost({ scheduledAt: '2026-06-15T12:00:00.000Z', status: 'SCHEDULED' })
    const days = buildCalendarDays(2026, 6, [post])
    const day15 = days.find(d => d.num === 15 && d.isCurrentMonth)
    expect(day15?.posts).toHaveLength(1)
    expect(day15?.posts[0].id).toBe('p1')
  })

  it('PUBLISHED пост размещается по publishedAt, не scheduledAt', () => {
    const post = makePost({
      status: 'PUBLISHED',
      scheduledAt: '2026-06-10T12:00:00.000Z',
      publishedAt: '2026-06-22T12:00:00.000Z',
    })
    const days = buildCalendarDays(2026, 6, [post])
    const day22 = days.find(d => d.num === 22 && d.isCurrentMonth)
    const day10 = days.find(d => d.num === 10 && d.isCurrentMonth)
    expect(day22?.posts).toHaveLength(1)
    expect(day10?.posts).toHaveLength(0)
  })

  it('пост без даты не появляется ни в одном дне', () => {
    const post = makePost({ scheduledAt: null, publishedAt: null, status: 'DRAFT' })
    const days = buildCalendarDays(2026, 6, [post])
    expect(days.every(d => d.posts.length === 0)).toBe(true)
  })

  it('дим-дни (соседний месяц) имеют пустой массив постов', () => {
    const days = buildCalendarDays(2026, 1, []) // январь с отступом
    const dimDays = days.filter(d => !d.isCurrentMonth)
    expect(dimDays.every(d => d.posts.length === 0)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../buildCalendarDays'`

- [ ] **Step 3: Create AdminPost type**

Create `src/features/admin/types.ts`:

```ts
export type AdminPostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'

export interface AdminPost {
  id: string
  title: string
  slug: string
  status: AdminPostStatus
  scheduledAt: string | null   // ISO 8601
  publishedAt: string | null   // ISO 8601
  coverImageKey: string | null
  categories: { name: string; slug: string }[]
}
```

- [ ] **Step 4: Create buildCalendarDays helper**

Create `src/features/admin/lib/buildCalendarDays.ts`:

```ts
import type { AdminPost } from '../types'

export interface CalendarDay {
  num: number
  isCurrentMonth: boolean
  posts: AdminPost[]
}

export function buildCalendarDays(year: number, month: number, posts: AdminPost[]): CalendarDay[] {
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate()

  // Convert JS day (0=Sun) to Monday-first (0=Mon, 6=Sun)
  const firstWeekday = (firstDay.getDay() + 6) % 7

  const days: CalendarDay[] = []

  // Previous month padding
  for (let i = firstWeekday - 1; i >= 0; i--) {
    days.push({ num: daysInPrevMonth - i, isCurrentMonth: false, posts: [] })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayPosts = posts.filter(post => {
      const iso = post.status === 'PUBLISHED' ? post.publishedAt : post.scheduledAt
      if (!iso) return false
      const dt = new Date(iso)
      return dt.getFullYear() === year && dt.getMonth() + 1 === month && dt.getDate() === d
    })
    days.push({ num: d, isCurrentMonth: true, posts: dayPosts })
  }

  // Next month padding — complete last row
  let nextDay = 1
  while (days.length % 7 !== 0) {
    days.push({ num: nextDay++, isCurrentMonth: false, posts: [] })
  }

  return days
}
```

- [ ] **Step 5: Create admin queries**

Create `src/features/admin/queries.ts`:

```ts
import { prisma } from '@/shared/lib/prisma'
import type { AdminPost } from './types'

const adminPostSelect = {
  id: true,
  title: true,
  slug: true,
  status: true,
  scheduledAt: true,
  publishedAt: true,
  coverImageKey: true,
  categories: { select: { name: true, slug: true } },
} as const

export async function getCalendarPosts(year: number, month: number): Promise<AdminPost[]> {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)

  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { publishedAt: { gte: start, lte: end } },
        { scheduledAt: { gte: start, lte: end } },
      ],
    },
    select: adminPostSelect,
    orderBy: [{ scheduledAt: 'asc' }, { publishedAt: 'asc' }],
  })

  return posts.map(p => ({
    ...p,
    status: p.status as AdminPost['status'],
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
  }))
}

export async function getArchivePosts(): Promise<AdminPost[]> {
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: adminPostSelect,
  })

  return posts.map(p => ({
    ...p,
    status: p.status as AdminPost['status'],
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
  }))
}
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
npm test
```

Expected: `buildCalendarDays` tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/admin/
git commit -m "feat: add AdminPost type, queries, and buildCalendarDays helper"
```

---

## Task 3: Redux store + adminSlice

**Files:**
- Create: `src/features/admin/model/adminSlice.ts`
- Create: `src/features/admin/model/__tests__/adminSlice.test.ts`
- Create: `src/shared/store/index.ts`
- Create: `src/shared/store/provider.tsx`

**Interfaces:**
- Produces: `store`, `persistor`, `RootState`, `AppDispatch` from `@/shared/store`
- Produces: `setMonth`, `setSelectedPostId`, `setChannelOverride` actions
- Produces: `ReduxProvider` component from `@/shared/store/provider`

- [ ] **Step 1: Write failing tests for adminSlice**

Create `src/features/admin/model/__tests__/adminSlice.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import adminReducer, {
  setMonth,
  setSelectedPostId,
  setChannelOverride,
} from '../adminSlice'

const today = new Date()

describe('adminSlice', () => {
  it('начальное состояние — текущий месяц и год', () => {
    const state = adminReducer(undefined, { type: '@@INIT' })
    expect(state.currentYear).toBe(today.getFullYear())
    expect(state.currentMonth).toBe(today.getMonth() + 1)
    expect(state.selectedPostId).toBeNull()
    expect(state.channelOverrides).toEqual({})
  })

  it('setMonth обновляет год и месяц', () => {
    const state = adminReducer(undefined, setMonth({ year: 2027, month: 3 }))
    expect(state.currentYear).toBe(2027)
    expect(state.currentMonth).toBe(3)
  })

  it('setSelectedPostId выбирает пост', () => {
    const state = adminReducer(undefined, setSelectedPostId('abc-123'))
    expect(state.selectedPostId).toBe('abc-123')
  })

  it('setSelectedPostId(null) снимает выбор', () => {
    const s1 = adminReducer(undefined, setSelectedPostId('abc'))
    const s2 = adminReducer(s1, setSelectedPostId(null))
    expect(s2.selectedPostId).toBeNull()
  })

  it('setChannelOverride устанавливает отдельный канал', () => {
    const state = adminReducer(
      undefined,
      setChannelOverride({ postId: 'p1', channel: 'vk', enabled: false })
    )
    expect(state.channelOverrides['p1'].vk).toBe(false)
  })

  it('setChannelOverride не затирает другой канал того же поста', () => {
    const s1 = adminReducer(
      undefined,
      setChannelOverride({ postId: 'p1', channel: 'vk', enabled: true })
    )
    const s2 = adminReducer(
      s1,
      setChannelOverride({ postId: 'p1', channel: 'tg', enabled: false })
    )
    expect(s2.channelOverrides['p1'].vk).toBe(true)
    expect(s2.channelOverrides['p1'].tg).toBe(false)
  })

  it('setChannelOverride разные посты независимы', () => {
    const s1 = adminReducer(
      undefined,
      setChannelOverride({ postId: 'p1', channel: 'vk', enabled: true })
    )
    const s2 = adminReducer(
      s1,
      setChannelOverride({ postId: 'p2', channel: 'vk', enabled: false })
    )
    expect(s2.channelOverrides['p1'].vk).toBe(true)
    expect(s2.channelOverrides['p2'].vk).toBe(false)
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../adminSlice'`

- [ ] **Step 3: Create adminSlice**

Create `src/features/admin/model/adminSlice.ts`:

```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AdminState {
  currentYear: number
  currentMonth: number
  selectedPostId: string | null
  channelOverrides: Record<string, { vk?: boolean; tg?: boolean }>
}

const now = new Date()

const initialState: AdminState = {
  currentYear: now.getFullYear(),
  currentMonth: now.getMonth() + 1,
  selectedPostId: null,
  channelOverrides: {},
}

export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setMonth(state, action: PayloadAction<{ year: number; month: number }>) {
      state.currentYear = action.payload.year
      state.currentMonth = action.payload.month
    },
    setSelectedPostId(state, action: PayloadAction<string | null>) {
      state.selectedPostId = action.payload
    },
    setChannelOverride(
      state,
      action: PayloadAction<{ postId: string; channel: 'vk' | 'tg'; enabled: boolean }>
    ) {
      const { postId, channel, enabled } = action.payload
      if (!state.channelOverrides[postId]) state.channelOverrides[postId] = {}
      state.channelOverrides[postId][channel] = enabled
    },
  },
})

export const { setMonth, setSelectedPostId, setChannelOverride } = adminSlice.actions
export default adminSlice.reducer
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: adminSlice tests PASS.

- [ ] **Step 5: Create Redux store**

Create `src/shared/store/index.ts`:

```ts
import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import adminReducer from '@/features/admin/model/adminSlice'

const adminPersistConfig = {
  key: 'admin',
  storage,
  // channelOverrides is session-only — not persisted
  whitelist: ['currentYear', 'currentMonth', 'selectedPostId'],
}

const persistedAdmin = persistReducer(adminPersistConfig, adminReducer)

export const store = configureStore({
  reducer: {
    admin: persistedAdmin,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

- [ ] **Step 6: Create ReduxProvider**

Create `src/shared/store/provider.tsx`:

```tsx
'use client'

import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './index'

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  )
}
```

- [ ] **Step 7: Run tests — verify still passing**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/features/admin/model/ src/shared/store/
git commit -m "feat: add adminSlice and Redux store with persist"
```

---

## Task 4: NextAuth config + middleware + login page

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`
- Modify: `src/app/(admin)/login/page.tsx`

**Interfaces:**
- Produces: `authOptions: NextAuthOptions` from `@/lib/auth`
- Produces: middleware protecting `/admin/*` except `/admin/login`

- [ ] **Step 1: Create NextAuth config**

Create `src/lib/auth.ts`:

```ts
import type { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const allowlist = (process.env.ADMIN_ALLOWLIST ?? '')
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
      if (allowlist.length === 0) return false
      return allowlist.includes(profile?.email ?? '')
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
```

- [ ] **Step 2: Create NextAuth route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 3: Create middleware**

Create `src/middleware.ts`:

```ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: { signIn: '/admin/login' },
})

export const config = {
  matcher: ['/admin/((?!login$).*)'],
}
```

- [ ] **Step 4: Update login page**

Replace `src/app/(admin)/login/page.tsx` with:

```tsx
'use client'

import { signIn } from 'next-auth/react'
import Image from 'next/image'

export default function AdminLoginPage() {
  return (
    <div
      style={{ background: '#0e0a0b', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, textAlign: 'center' }}>
        <Image src="/logo-white.svg" alt="PHL·ART" width={48} height={48} />
        <div>
          <p className="font-display font-bold text-white lowercase m-0" style={{ fontSize: 24, letterSpacing: '-0.01em' }}>
            Студия публикаций
          </p>
          <p className="font-body font-light m-0 mt-2" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            Войдите, чтобы продолжить
          </p>
        </div>
        <button
          onClick={() => signIn('github', { callbackUrl: '/admin/dashboard' })}
          className="font-nav font-bold uppercase"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#ff3b30', color: '#fff', border: 'none',
            padding: '13px 24px', fontSize: 12, letterSpacing: '0.06em',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Войти через GitHub
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: all tests pass (no new tests for auth — manual verification below).

- [ ] **Step 6: Manual verification**

```bash
npm run dev
```

Visit `http://localhost:3000/admin/dashboard` — should redirect to `/admin/login`.
Visit `http://localhost:3000/admin/login` — should show logo + GitHub button (dark background).

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth.ts src/middleware.ts src/app/api/auth/ src/app/(admin)/login/page.tsx
git commit -m "feat: add NextAuth GitHub login and admin route protection"
```

---

## Task 5: Admin layout update + dashboard page stub

**Files:**
- Modify: `src/app/(admin)/layout.tsx`
- Create: `src/app/(admin)/dashboard/page.tsx`

**Interfaces:**
- Produces: admin layout with dark theme + ReduxProvider
- Produces: `/admin/dashboard` page route

- [ ] **Step 1: Update admin layout**

Replace `src/app/(admin)/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { ReduxProvider } from '@/shared/store/provider'

export const metadata: Metadata = {
  title: 'Студия публикаций — PHL·ART',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="min-h-screen" style={{ background: '#0e0a0b', color: '#fff' }}>
      <ReduxProvider>
        {children}
      </ReduxProvider>
    </div>
  )
}
```

- [ ] **Step 2: Create dashboard page**

Create `src/app/(admin)/dashboard/page.tsx`:

```tsx
import { AdminDashboard } from '@/features/admin/ui/AdminDashboard'

export default function DashboardPage() {
  return <AdminDashboard />
}
```

- [ ] **Step 3: Add redirect from /admin to /admin/dashboard**

Check if `src/app/(admin)/page.tsx` exists. If not, create it:

```tsx
import { redirect } from 'next/navigation'

export default function AdminIndexPage() {
  redirect('/admin/dashboard')
}
```

If a `page.tsx` at `(admin)` level doesn't work due to route groups, add an `app/admin/page.tsx` redirect instead:

```
src/app/admin/page.tsx  ← if needed
```

```tsx
import { redirect } from 'next/navigation'
export default function AdminPage() { redirect('/admin/dashboard') }
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/(admin)/layout.tsx src/app/(admin)/dashboard/
git commit -m "feat: update admin layout with ReduxProvider and dark theme"
```

---

## Task 6: Admin API route `/api/admin/posts`

**Files:**
- Create: `src/app/api/admin/posts/route.ts`

**Interfaces:**
- Consumes: `getCalendarPosts(year, month)`, `getArchivePosts()` from `@/features/admin/queries`
- Consumes: `authOptions` from `@/lib/auth`
- Produces: `GET /api/admin/posts?year=YYYY&month=M` → `{ calendarPosts: AdminPost[], archivePosts: AdminPost[] }`

- [ ] **Step 1: Create route handler**

Create `src/app/api/admin/posts/route.ts`:

```ts
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getCalendarPosts, getArchivePosts } from '@/features/admin/queries'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const yearRaw = searchParams.get('year')
  const monthRaw = searchParams.get('month')

  const year = yearRaw ? parseInt(yearRaw, 10) : new Date().getFullYear()
  const month = monthRaw ? parseInt(monthRaw, 10) : new Date().getMonth() + 1

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return Response.json({ error: 'Invalid year or month' }, { status: 400 })
  }

  const [calendarPosts, archivePosts] = await Promise.all([
    getCalendarPosts(year, month),
    getArchivePosts(),
  ])

  return Response.json({ calendarPosts, archivePosts })
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/posts/
git commit -m "feat: add /api/admin/posts protected route"
```

---

## Task 7: `publishPost` Server Action

**Files:**
- Create: `src/features/admin/actions/publishPost.ts`

**Interfaces:**
- Consumes: `authOptions` from `@/lib/auth`, `prisma` from `@/shared/lib/prisma`
- Produces: `publishPost(postId, channels) → Promise<{ success: boolean; error?: string }>`

- [ ] **Step 1: Create Server Action**

Create `src/features/admin/actions/publishPost.ts`:

```ts
'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'

async function crossPostToChannels(
  postId: string,
  channels: { vk: boolean; tg: boolean }
): Promise<void> {
  // Future: dispatch to registered cross-posting providers
  console.log('[crosspost] postId=%s channels=%j', postId, channels)
}

export async function publishPost(
  postId: string,
  channels: { vk: boolean; tg: boolean }
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      select: {
        slug: true,
        categories: { select: { slug: true } },
      },
    })

    revalidatePath('/')
    revalidatePath(`/post/${post.slug}`)
    for (const cat of post.categories) {
      revalidatePath(`/${cat.slug}`)
    }

    await crossPostToChannels(postId, channels)

    return { success: true }
  } catch (err) {
    console.error('[publishPost]', err)
    return { success: false, error: 'Failed to publish post' }
  }
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/actions/
git commit -m "feat: add publishPost server action with revalidation"
```

---

## Task 8: Admin shell — Sidebar, Topbar, BottomNav

**Files:**
- Create: `src/features/admin/ui/AdminSidebar.tsx`
- Create: `src/features/admin/ui/AdminTopbar.tsx`
- Create: `src/features/admin/ui/AdminBottomNav.tsx`

**Interfaces:**
- Produces: `AdminSidebar` — `hidden lg:flex`, 72px, dark bg, icon nav
- Produces: `AdminTopbar` — desktop header + mobile compact header + mobile tabs
- Produces: `AdminBottomNav` — `flex lg:hidden`, `position: fixed bottom-0`

- [ ] **Step 1: Create AdminSidebar**

Create `src/features/admin/ui/AdminSidebar.tsx`:

```tsx
import Image from 'next/image'

export function AdminSidebar() {
  return (
    <div
      className="hidden lg:flex flex-col items-center flex-shrink-0 py-6 gap-1.5"
      style={{ width: 72, background: '#0a0708', borderRight: '1px solid rgba(255,255,255,0.08)' }}
    >
      <Image src="/logo-white.svg" alt="PHL·ART" width={34} height={34} style={{ marginBottom: 18 }} />

      {/* Calendar — active */}
      <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,59,48,0.14)', color: '#ff3b30' }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
        </svg>
      </div>

      {/* List */}
      <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)' }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" />
        </svg>
      </div>

      {/* Upload */}
      <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)' }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </div>

      {/* Photo */}
      <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)' }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>

      {/* Avatar */}
      <div style={{ marginTop: 'auto', width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#ff3b30,#7a1d18)' }} />
    </div>
  )
}
```

- [ ] **Step 2: Create AdminTopbar**

Create `src/features/admin/ui/AdminTopbar.tsx`:

```tsx
import Image from 'next/image'

export function AdminTopbar() {
  return (
    <>
      {/* Desktop topbar */}
      <div
        className="hidden lg:flex items-center justify-between px-8 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-6">
          <h1
            className="font-display font-bold m-0"
            style={{ fontSize: 24, letterSpacing: '-0.01em' }}
          >
            Студия публикаций
          </h1>
          <div className="flex gap-1">
            <span
              className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase"
              style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.08)', color: '#fff' }}
            >
              обзор
            </span>
            <span
              className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase"
              style={{ padding: '7px 14px', color: 'rgba(255,255,255,0.5)' }}
            >
              архив
            </span>
          </div>
        </div>
        <button
          disabled
          className="font-nav font-bold text-[12px] tracking-[0.06em] uppercase opacity-40 cursor-not-allowed flex items-center gap-2"
          style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '11px 18px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Новый пост
        </button>
      </div>

      {/* Mobile topbar */}
      <div
        className="flex lg:hidden items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <Image src="/logo-white.svg" alt="PHL·ART" width={32} height={32} />
          <h1
            className="font-display font-bold m-0"
            style={{ fontSize: 18, letterSpacing: '-0.01em' }}
          >
            Студия
          </h1>
        </div>
        <button
          disabled
          className="font-nav font-bold text-[11px] tracking-[0.05em] uppercase opacity-40 cursor-not-allowed flex items-center gap-1.5"
          style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '9px 14px' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Пост
        </button>
      </div>

      {/* Mobile tabs */}
      <div className="flex lg:hidden gap-6 px-5 pt-3.5 font-nav font-bold text-[12px] tracking-[0.06em] uppercase">
        <span className="pb-2.5" style={{ borderBottom: '2px solid #ff3b30' }}>обзор</span>
        <span className="pb-2.5" style={{ color: 'rgba(255,255,255,0.45)' }}>архив</span>
      </div>
      <div className="lg:hidden h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </>
  )
}
```

- [ ] **Step 3: Create AdminBottomNav**

Create `src/features/admin/ui/AdminBottomNav.tsx`:

```tsx
export function AdminBottomNav() {
  return (
    <div
      className="flex lg:hidden fixed bottom-0 left-0 right-0 items-center justify-around py-3 px-6"
      style={{ background: '#0a0708', borderTop: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Calendar — active */}
      <span style={{ color: '#ff3b30', display: 'flex' }}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
        </svg>
      </span>
      <span style={{ color: 'rgba(255,255,255,0.45)', display: 'flex' }}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" />
        </svg>
      </span>
      <span style={{ color: 'rgba(255,255,255,0.45)', display: 'flex' }}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </span>
      <span style={{ color: 'rgba(255,255,255,0.45)', display: 'flex' }}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </span>
      <span
        style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#ff3b30,#7a1d18)', display: 'inline-block' }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/ui/AdminSidebar.tsx src/features/admin/ui/AdminTopbar.tsx src/features/admin/ui/AdminBottomNav.tsx
git commit -m "feat: add admin shell components (sidebar, topbar, bottom nav)"
```

---

## Task 9: AdminCalendar component

**Files:**
- Create: `src/features/admin/ui/AdminCalendar.tsx`

**Interfaces:**
- Consumes: `buildCalendarDays` from `@/features/admin/lib/buildCalendarDays`
- Consumes: `AdminPost` from `@/features/admin/types`
- Props: `{ posts, year, month, selectedPostId, onSelectPost, onNavigate, isLoading }`

- [ ] **Step 1: Create AdminCalendar**

Create `src/features/admin/ui/AdminCalendar.tsx`:

```tsx
'use client'

import { buildCalendarDays } from '@/features/admin/lib/buildCalendarDays'
import type { AdminPost } from '@/features/admin/types'

const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
const MONTHS_RU = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]
const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: '#3ec27a',
  SCHEDULED: '#ffb02e',
  DRAFT: 'rgba(255,255,255,0.4)',
}

interface Props {
  posts: AdminPost[]
  year: number
  month: number
  selectedPostId: string | null
  onSelectPost: (id: string) => void
  onNavigate: (year: number, month: number) => void
  isLoading: boolean
}

export function AdminCalendar({ posts, year, month, selectedPostId, onSelectPost, onNavigate, isLoading }: Props) {
  const days = buildCalendarDays(year, month, posts)

  function goToPrev() {
    if (month === 1) onNavigate(year - 1, 12)
    else onNavigate(year, month - 1)
  }
  function goToNext() {
    if (month === 12) onNavigate(year + 1, 1)
    else onNavigate(year, month + 1)
  }

  function formatTime(iso: string | null): string {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-base m-0">Календарь публикаций</h2>
        <div className="flex items-center gap-3.5">
          <button
            onClick={goToPrev}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', display: 'flex', padding: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="font-nav font-bold text-[12px] tracking-[0.08em] uppercase">
            {MONTHS_RU[month - 1]} {year}
          </span>
          <button
            onClick={goToNext}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', display: 'flex', padding: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ border: '1px solid rgba(255,255,255,0.1)', opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        {/* Weekday header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'rgba(255,255,255,0.04)' }}>
          {WEEKDAYS.map(wd => (
            <div
              key={wd}
              className="font-nav font-bold text-[10px] tracking-[0.08em] uppercase"
              style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.5)' }}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days.map((day, i) => (
            <div
              key={i}
              className="min-h-[46px] lg:min-h-[98px]"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.07)',
                borderLeft: '1px solid rgba(255,255,255,0.07)',
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              {/* Desktop: number */}
              <span
                className="hidden lg:block font-display font-bold text-[12px]"
                style={{ color: day.isCurrentMonth ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.22)' }}
              >
                {day.num}
              </span>

              {/* Desktop: post cards */}
              <div className="hidden lg:flex flex-col gap-1.5">
                {day.posts.map(post => (
                  <button
                    key={post.id}
                    onClick={() => onSelectPost(post.id)}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      minWidth: 0,
                      background: 'rgba(255,255,255,0.05)',
                      padding: '5px 7px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      boxShadow: post.id === selectedPostId ? 'inset 0 0 0 1px #ff3b30' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: STATUS_COLOR[post.status] ?? STATUS_COLOR.DRAFT,
                      }} />
                      <span className="font-body font-light text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {post.status === 'PUBLISHED' ? formatTime(post.publishedAt) : formatTime(post.scheduledAt)}
                      </span>
                    </div>
                    <span
                      className="font-display font-bold text-[11px]"
                      style={{ lineHeight: 1.1, color: 'rgba(255,255,255,0.92)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                    >
                      {post.title}
                    </span>
                  </button>
                ))}
              </div>

              {/* Mobile: number + dots */}
              <div className="lg:hidden flex flex-col items-center gap-1 pt-1">
                <span
                  className="font-display font-bold text-[11px]"
                  style={{ color: day.isCurrentMonth ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.22)' }}
                >
                  {day.num}
                </span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {day.posts.map(post => (
                    <button
                      key={post.id}
                      onClick={() => onSelectPost(post.id)}
                      style={{
                        all: 'unset',
                        width: 5, height: 5, borderRadius: '50%', cursor: 'pointer',
                        background: STATUS_COLOR[post.status] ?? STATUS_COLOR.DRAFT,
                        boxShadow: post.id === selectedPostId ? '0 0 0 2px rgba(255,59,48,0.55)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile legend */}
      <div className="lg:hidden flex flex-wrap gap-4 mt-3 font-body font-light text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {([['#3ec27a', 'опубликовано'], ['#ffb02e', 'запланировано'], ['rgba(255,255,255,0.4)', 'черновик']] as const).map(([color, label]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/ui/AdminCalendar.tsx
git commit -m "feat: add AdminCalendar component"
```

---

## Task 10: AdminAgenda component (mobile)

**Files:**
- Create: `src/features/admin/ui/AdminAgenda.tsx`

**Interfaces:**
- Props: `{ posts: AdminPost[], selectedPostId: string | null, onSelectPost: (id: string) => void }`
- Shows posts with `status !== 'PUBLISHED'`, sorted by `scheduledAt`

- [ ] **Step 1: Create AdminAgenda**

Create `src/features/admin/ui/AdminAgenda.tsx`:

```tsx
import type { AdminPost } from '@/features/admin/types'

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: '#3ec27a',
  SCHEDULED: '#ffb02e',
  DRAFT: 'rgba(255,255,255,0.4)',
}

interface Props {
  posts: AdminPost[]
  selectedPostId: string | null
  onSelectPost: (id: string) => void
}

export function AdminAgenda({ posts, selectedPostId, onSelectPost }: Props) {
  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL

  const agenda = posts
    .filter(p => p.status !== 'PUBLISHED')
    .sort((a, b) => {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity
      return ta - tb
    })

  if (agenda.length === 0) return null

  return (
    <div>
      <h2 className="font-display font-bold text-base m-0 mb-3">Ближайшие публикации</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {agenda.map(post => {
          const coverSrc = post.coverImageKey && s3Base ? `${s3Base}/${post.coverImageKey}` : null
          const whenLabel = post.scheduledAt
            ? new Date(post.scheduledAt).toLocaleString('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
            : '—'

          return (
            <button
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '11px 13px',
                boxShadow: post.id === selectedPostId ? 'inset 0 0 0 1px #ff3b30' : 'none',
              }}
            >
              <div style={{
                width: 46, height: 46, flexShrink: 0,
                backgroundSize: 'cover', backgroundPosition: 'center',
                backgroundImage: coverSrc ? `url(${coverSrc})` : undefined,
                background: coverSrc ? undefined : 'linear-gradient(135deg,#ff3b30,#7a1d18)',
                border: '1px solid rgba(255,255,255,0.14)',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: STATUS_COLOR[post.status] }} />
                  <span className="font-nav font-bold text-[9px] tracking-[0.06em] uppercase" style={{ color: '#ff5a4a' }}>
                    {post.categories[0]?.name ?? '—'}
                  </span>
                  <span className="font-body font-light text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {whenLabel}
                  </span>
                </div>
                <div
                  className="font-display font-bold text-[14px]"
                  style={{ lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {post.title}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/ui/AdminAgenda.tsx
git commit -m "feat: add AdminAgenda component (mobile upcoming posts)"
```

---

## Task 11: CrossPostingPanel component

**Files:**
- Create: `src/features/admin/ui/CrossPostingPanel.tsx`

**Interfaces:**
- Props: `{ post: AdminPost | null, channels: { vk?: boolean; tg?: boolean }, onToggle: (channel: 'vk'|'tg', enabled: boolean) => void, onPublish: () => void, isPublishing: boolean }`

- [ ] **Step 1: Create CrossPostingPanel**

Create `src/features/admin/ui/CrossPostingPanel.tsx`:

```tsx
import type { AdminPost } from '@/features/admin/types'

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: 'опубликовано',
  SCHEDULED: 'запланировано',
  DRAFT: 'черновик',
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      style={{
        cursor: 'pointer',
        width: 38, height: 21,
        borderRadius: 999,
        background: on ? '#ff3b30' : 'rgba(255,255,255,0.14)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          [on ? 'right' : 'left']: 2,
          width: 17, height: 17,
          borderRadius: '50%',
          background: on ? '#fff' : 'rgba(255,255,255,0.55)',
          transition: 'left 0.15s, right 0.15s',
        }}
      />
    </div>
  )
}

const CHANNELS = [
  { key: 'vk' as const, name: 'VK',  handle: 'phl_art' },
  { key: 'tg' as const, name: 'TG',  handle: '@phlart' },
]

interface Props {
  post: AdminPost | null
  channels: { vk?: boolean; tg?: boolean }
  onToggle: (channel: 'vk' | 'tg', enabled: boolean) => void
  onPublish: () => void
  isPublishing: boolean
}

export function CrossPostingPanel({ post, channels, onToggle, onPublish, isPublishing }: Props) {
  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL
  const coverSrc = post?.coverImageKey && s3Base ? `${s3Base}/${post.coverImageKey}` : null

  const isPublished = post?.status === 'PUBLISHED'
  const btnDisabled = !post || isPublished || isPublishing

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.03)',
      minHeight: 520,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div
        className="font-nav font-bold text-[11px] tracking-[0.1em] uppercase"
        style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
      >
        Кросс-постинг
      </div>

      {/* Empty state */}
      {!post && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '40px 26px', textAlign: 'center' }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.6">
            <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <div className="font-body font-light text-[15px]" style={{ lineHeight: 1.5, color: 'rgba(255,255,255,0.5)', maxWidth: 200 }}>
            Выберите пост в календаре, чтобы настроить публикацию в каналы
          </div>
        </div>
      )}

      {/* Selected state */}
      {post && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 18 }}>
          {/* Cover */}
          <div style={{
            height: 140,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: coverSrc ? `url(${coverSrc})` : undefined,
            background: coverSrc ? undefined : 'linear-gradient(135deg,#ff3b30,#7a1d18)',
            border: '1px solid rgba(255,255,255,0.14)',
            marginBottom: 14,
          }} />

          {/* Meta */}
          <div className="font-nav font-bold text-[10px] tracking-[0.1em] uppercase" style={{ color: '#ff5a4a', marginBottom: 6 }}>
            {post.categories.map(c => c.name).join(', ')} · {STATUS_LABEL[post.status] ?? post.status}
          </div>
          <div className="font-display font-bold text-[18px]" style={{ lineHeight: 1.1 }}>
            {post.title}
          </div>

          {/* Channels */}
          <div className="font-nav font-bold text-[11px] tracking-[0.1em] uppercase" style={{ color: 'rgba(255,255,255,0.5)', margin: '22px 0 12px' }}>
            платформы публикации
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CHANNELS.map(({ key, name, handle }) => {
              const enabled = channels[key] ?? true
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    padding: '13px 15px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <span className="font-nav font-bold text-[13px] tracking-[0.04em]">{name}</span>
                    <span className="font-body font-light text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{handle}</span>
                  </div>
                  <Toggle on={enabled} onToggle={() => onToggle(key, !enabled)} />
                </div>
              )
            })}
          </div>

          {/* Scheduled time */}
          <div className="font-nav font-bold text-[11px] tracking-[0.1em] uppercase" style={{ color: 'rgba(255,255,255,0.5)', margin: '22px 0 10px' }}>
            время выхода
          </div>
          <div
            className="font-body font-light text-[15px]"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', padding: '13px 15px' }}
          >
            <span>
              {post.scheduledAt
                ? new Date(post.scheduledAt).toLocaleString('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
                : '—'}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />
            </svg>
          </div>

          {/* Publish button */}
          <button
            onClick={onPublish}
            disabled={btnDisabled}
            className="font-nav font-bold text-[12px] tracking-[0.06em] uppercase"
            style={{
              marginTop: 22,
              width: '100%',
              background: isPublished ? 'rgba(255,255,255,0.1)' : '#ff3b30',
              color: '#fff',
              border: 'none',
              padding: 14,
              cursor: btnDisabled ? 'not-allowed' : 'pointer',
              opacity: btnDisabled ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {isPublishing ? 'Публикуется...' : isPublished ? 'Уже опубликовано' : 'Опубликовать в выбранные каналы'}
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/ui/CrossPostingPanel.tsx
git commit -m "feat: add CrossPostingPanel component"
```

---

## Task 12: AdminArchive component

**Files:**
- Create: `src/features/admin/ui/AdminArchive.tsx`

**Interfaces:**
- Props: `{ posts: AdminPost[] }`
- Desktop: table — материал | раздел | дата | каналы | охват
- Mobile: card list

- [ ] **Step 1: Create AdminArchive**

Create `src/features/admin/ui/AdminArchive.tsx`:

```tsx
import type { AdminPost } from '@/features/admin/types'

interface Props {
  posts: AdminPost[]
}

function CoverThumb({ post, size }: { post: AdminPost; size: number }) {
  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL
  const src = post.coverImageKey && s3Base ? `${s3Base}/${post.coverImageKey}` : null
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      backgroundSize: 'cover', backgroundPosition: 'center',
      backgroundImage: src ? `url(${src})` : undefined,
      background: src ? undefined : 'linear-gradient(135deg,#ff3b30,#7a1d18)',
      border: '1px solid rgba(255,255,255,0.14)',
    }} />
  )
}

const COL_TEMPLATE = '1fr 110px 130px 120px 90px'
const HEADER_CELLS = ['материал', 'раздел', 'дата', 'каналы', 'охват']

export function AdminArchive({ posts }: Props) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display font-bold text-base m-0">Архив постов</h2>
        <span className="font-nav font-bold text-[10px] tracking-[0.07em] uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {posts.length} материал{posts.length === 1 ? '' : posts.length < 5 ? 'а' : 'ов'}
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Header row */}
        <div
          style={{ display: 'grid', gridTemplateColumns: COL_TEMPLATE, gap: 16, padding: '11px 18px', background: 'rgba(255,255,255,0.04)' }}
          className="font-nav font-bold text-[10px] tracking-[0.08em] uppercase"
        >
          {HEADER_CELLS.map(cell => (
            <div key={cell} style={{ color: 'rgba(255,255,255,0.5)', textAlign: cell === 'охват' ? 'right' : 'left' }}>{cell}</div>
          ))}
        </div>

        {/* Data rows */}
        {posts.map(post => {
          const date = post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
            : '—'
          return (
            <div
              key={post.id}
              style={{ display: 'grid', gridTemplateColumns: COL_TEMPLATE, gap: 16, padding: '13px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CoverThumb post={post} size={38} />
                <span className="font-display font-bold text-[14px]">{post.title}</span>
              </div>
              <div className="font-nav font-bold text-[11px] tracking-[0.05em] uppercase" style={{ color: '#ff5a4a' }}>
                {post.categories[0]?.name ?? '—'}
              </div>
              <div className="font-body font-light text-[14px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {date}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['VK', 'TG'] as const).map(ch => (
                  <span
                    key={ch}
                    className="font-nav font-bold text-[10px]"
                    style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.18)', padding: '3px 7px' }}
                  >
                    {ch}
                  </span>
                ))}
              </div>
              <div className="font-display font-bold text-[14px]" style={{ textAlign: 'right', color: 'rgba(255,255,255,0.5)' }}>
                —
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile list */}
      <div className="lg:hidden flex flex-col gap-2.5">
        {posts.map(post => {
          const date = post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString('ru', { day: 'numeric', month: 'long' })
            : '—'
          return (
            <div
              key={post.id}
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '11px 13px' }}
            >
              <CoverThumb post={post} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="font-display font-bold text-[14px]"
                  style={{ lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {post.title}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-nav font-bold text-[9px] tracking-[0.05em] uppercase" style={{ color: '#ff5a4a' }}>
                    {post.categories[0]?.name ?? '—'}
                  </span>
                  <span className="font-body font-light text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {date}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                <span className="font-display font-bold text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>—</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['VK', 'TG'] as const).map(ch => (
                    <span
                      key={ch}
                      className="font-nav font-bold text-[9px]"
                      style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.18)', padding: '2px 6px' }}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/ui/AdminArchive.tsx
git commit -m "feat: add AdminArchive component (table + mobile list)"
```

---

## Task 13: AdminDashboard client orchestrator

**Files:**
- Create: `src/features/admin/ui/AdminDashboard.tsx`

**Interfaces:**
- Consumes: all `@/features/admin/ui/*`, `@/features/admin/actions/publishPost`, Redux store
- Produces: full dashboard UI at `/admin/dashboard`

- [ ] **Step 1: Create AdminDashboard**

Create `src/features/admin/ui/AdminDashboard.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '@/shared/store'
import { setMonth, setSelectedPostId, setChannelOverride } from '@/features/admin/model/adminSlice'
import type { AdminPost } from '@/features/admin/types'
import { publishPost } from '@/features/admin/actions/publishPost'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopbar } from './AdminTopbar'
import { AdminCalendar } from './AdminCalendar'
import { AdminAgenda } from './AdminAgenda'
import { CrossPostingPanel } from './CrossPostingPanel'
import { AdminArchive } from './AdminArchive'
import { AdminBottomNav } from './AdminBottomNav'

export function AdminDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const { currentYear, currentMonth, selectedPostId, channelOverrides } = useSelector(
    (state: RootState) => state.admin
  )

  const [calendarPosts, setCalendarPosts] = useState<AdminPost[]>([])
  const [archivePosts, setArchivePosts] = useState<AdminPost[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/admin/posts?year=${currentYear}&month=${currentMonth}`)
      .then(r => r.json())
      .then(data => {
        setCalendarPosts(data.calendarPosts ?? [])
        setArchivePosts(data.archivePosts ?? [])
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [currentYear, currentMonth])

  const selectedPost = calendarPosts.find(p => p.id === selectedPostId) ?? null
  const channels = channelOverrides[selectedPostId ?? ''] ?? { vk: true, tg: true }

  async function handlePublish() {
    if (!selectedPostId) return
    setIsPublishing(true)
    const result = await publishPost(selectedPostId, {
      vk: channels.vk ?? true,
      tg: channels.tg ?? true,
    })
    if (result.success) {
      // Refetch to update post status in UI
      const data = await fetch(`/api/admin/posts?year=${currentYear}&month=${currentMonth}`).then(r => r.json())
      setCalendarPosts(data.calendarPosts ?? [])
      setArchivePosts(data.archivePosts ?? [])
    }
    setIsPublishing(false)
  }

  function handleSelectPost(id: string) {
    dispatch(setSelectedPostId(id === selectedPostId ? null : id))
  }

  function handleNavigate(year: number, month: number) {
    dispatch(setMonth({ year, month }))
    dispatch(setSelectedPostId(null))
  }

  function handleToggleChannel(channel: 'vk' | 'tg', enabled: boolean) {
    if (!selectedPostId) return
    dispatch(setChannelOverride({ postId: selectedPostId, channel, enabled }))
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0e0a0b', color: '#fff' }}>
      <AdminSidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopbar />

        {/* Desktop body */}
        <div className="hidden lg:flex flex-col flex-1 gap-5 overflow-auto" style={{ padding: '24px 30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 22, alignItems: 'start' }}>
            <AdminCalendar
              posts={calendarPosts}
              year={currentYear}
              month={currentMonth}
              selectedPostId={selectedPostId}
              onSelectPost={handleSelectPost}
              onNavigate={handleNavigate}
              isLoading={isLoading}
            />
            <CrossPostingPanel
              post={selectedPost}
              channels={channels}
              onToggle={handleToggleChannel}
              onPublish={handlePublish}
              isPublishing={isPublishing}
            />
          </div>
          <AdminArchive posts={archivePosts} />
        </div>

        {/* Mobile body */}
        <div className="flex lg:hidden flex-col gap-6 px-5 py-5" style={{ paddingBottom: 96 }}>
          <AdminCalendar
            posts={calendarPosts}
            year={currentYear}
            month={currentMonth}
            selectedPostId={selectedPostId}
            onSelectPost={handleSelectPost}
            onNavigate={handleNavigate}
            isLoading={isLoading}
          />
          <AdminAgenda
            posts={calendarPosts}
            selectedPostId={selectedPostId}
            onSelectPost={handleSelectPost}
          />
          <CrossPostingPanel
            post={selectedPost}
            channels={channels}
            onToggle={handleToggleChannel}
            onPublish={handlePublish}
            isPublishing={isPublishing}
          />
          <AdminArchive posts={archivePosts} />
        </div>

        <AdminBottomNav />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Manual end-to-end verification**

```bash
npm run dev
```

1. Visit `http://localhost:3000/admin/dashboard` → should redirect to `/admin/login` (not authenticated yet)
2. If you want to test with mock auth, temporarily remove middleware matcher or set a session cookie
3. Once authenticated, verify:
   - Desktop: sidebar (72px dark) + topbar + calendar grid + cross-posting panel (right, 360px) + archive table
   - Mobile (resize to <1024px): compact topbar + tabs + compact calendar (dots) + agenda + cross-posting + archive list + fixed bottom nav
   - Click a post dot/card → cross-posting panel populates with post details
   - Toggle VK/TG → toggles flip visually
   - Click «Опубликовать» → post status changes in DB, public site cache invalidated

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/ui/AdminDashboard.tsx
git commit -m "feat: add AdminDashboard orchestrator — wires calendar, panel, archive"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] NextAuth GitHub OAuth + allowlist → Task 4
- [x] `scheduledAt` migration → Task 1
- [x] Redux + adminSlice + localStorage persist → Task 3
- [x] Admin layout dark-only + ReduxProvider → Task 5
- [x] `/api/admin/posts` protected route → Task 6
- [x] `publishPost` Server Action + revalidation → Task 7
- [x] `crossPostToChannels` stub → Task 7
- [x] AdminCalendar — desktop (posts) + mobile (dots) + legend → Task 9
- [x] AdminAgenda — mobile upcoming list → Task 10
- [x] CrossPostingPanel — empty/selected state, toggles, publish button → Task 11
- [x] AdminArchive — table (desktop) + list (mobile) → Task 12
- [x] AdminSidebar / AdminTopbar / AdminBottomNav → Task 8
- [x] Redirect `/admin` → `/admin/dashboard` → Task 5
- [x] Month navigation persisted → Tasks 3+13

**Type consistency:**
- `AdminPost` defined in Task 2, used consistently in Tasks 9–13 ✓
- `publishPost(postId: string, channels: { vk: boolean; tg: boolean })` defined in Task 7, called in Task 13 ✓
- `buildCalendarDays(year, month, posts)` defined in Task 2, used in Task 9 ✓
- Redux `setMonth`, `setSelectedPostId`, `setChannelOverride` defined in Task 3, used in Task 13 ✓
- `getCalendarPosts`, `getArchivePosts` defined in Task 2, used in Task 6 ✓
