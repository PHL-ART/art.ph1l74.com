# Card UX & /posts Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix card clickability, improve tag/category UX, add hover chip animation, and build an infinite-scroll /posts page.

**Architecture:** All server components stay server components — no new `'use client'` directives except `PostsInfiniteGrid`. The card click fix uses CSS `pointer-events` to let clicks fall through the content layer to a stretched link beneath. The /posts page combines a Next.js server page (initial SSR render) with a client component (IntersectionObserver for subsequent pages) talking to a new `/api/posts` route.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma via existing queries

## Global Constraints

- Server Components cannot use event handlers (`onClick`) — pointer-events must be CSS-only
- CSS variables for all colors — no hardcoded hex outside of gradient definitions
- Font classes: `font-display` (Manrope 700), `font-nav` (Montserrat 600-700), `font-body` (Jost 200-300)
- `CARD_GRADIENTS` always from `@/shared/lib/gradients`
- `formatDate` from `@/shared/lib/formatDate` (already accepts `Date | string | null`)
- `MediaCard` stays a Server Component — no `'use client'`
- Max content width: 1440px (set by layout.tsx)
- Tests run with: `npm test` (vitest)

---

### Task 1: CSS `.chip-link` Hover Animation

**Files:**
- Modify: `src/styles/globals.css`

**Interfaces:**
- Produces: `.chip-link` CSS class — adds a left-to-right underline animation using `::after` pseudo-element. Used by Tasks 2, 3, 4.

- [ ] **Step 1: Add `.chip-link` to globals.css**

Append to `src/styles/globals.css` after the existing Tailwind utility aliases:

```css
/* Chip link — left-to-right underline on hover */
.chip-link {
  position: relative;
  text-decoration: none;
}
.chip-link::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 0;
  height: 1px;
  background: currentColor;
  transition: width 0.25s ease;
}
.chip-link:hover::after {
  width: 100%;
}
```

- [ ] **Step 2: Verify no tests broken**

```bash
npm test
```

Expected: all tests still pass (globals.css not imported in test env).

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: add chip-link left-to-right underline hover animation"
```

---

### Task 2: MediaCard — Pointer-Events Fix + Tags in Date Row + Chip Animation

**Files:**
- Modify: `src/shared/ui/MediaCard.tsx`
- Modify: `src/shared/ui/__tests__/MediaCard.test.tsx`

**Interfaces:**
- Consumes: `chip-link` CSS class from Task 1, `CARD_GRADIENTS` from `@/shared/lib/gradients`, `Fragment` from `react`
- Produces: updated `MediaCard` — clickable card, tags in date row, chip-link animation on category/tag links

**Why pointer-events fix works:** The stretched `<Link>` is at `z-[1]`. The content wrapper is at `z-[2]` but has `pointer-events: none` — clicks fall through to the stretched link below. Inner category/tag `<Link>` elements override with `pointer-events: auto` so they still receive clicks.

- [ ] **Step 1: Write failing test for tags-in-date-row**

In `src/shared/ui/__tests__/MediaCard.test.tsx`, add one test:

```tsx
it('теги рядом с датой — отдельные ссылки', () => {
  render(
    <MediaCard
      {...baseProps}
      tags={[{ id: 't1', name: 'Лонгрид', slug: 'longgrid' }]}
    />,
  )
  // tag link exists
  expect(screen.getByRole('link', { name: 'Лонгрид' })).toBeInTheDocument()
  // tag link goes to /search?tag=longgrid
  expect(screen.getByRole('link', { name: 'Лонгрид' })).toHaveAttribute(
    'href',
    '/search?tag=longgrid',
  )
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "FAIL|теги рядом"
```

Expected: test fails — `MediaCard` currently renders tags in a separate row above the title, not in the date row.

- [ ] **Step 3: Rewrite MediaCard.tsx**

Replace `src/shared/ui/MediaCard.tsx` entirely:

```tsx
import { Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getPostUrl } from '@/shared/lib/getPostUrl'
import { formatDate } from '@/shared/lib/formatDate'
import { cn } from '@/shared/lib/cn'
import { CARD_GRADIENTS } from '@/shared/lib/gradients'

interface MediaCardProps {
  title: string
  slug: string
  coverImageKey?: string | null
  excerpt?: string | null
  publishedAt: Date | null
  categories: { id: string; name: string; slug: string }[]
  tags?: { id: string; name: string; slug: string }[]
  placeholderGradient?: string
  className?: string
}

export function MediaCard({
  title,
  slug,
  coverImageKey,
  excerpt,
  publishedAt,
  categories,
  tags,
  placeholderGradient = CARD_GRADIENTS[0],
  className,
}: MediaCardProps) {
  const date = formatDate(publishedAt)
  const tagList = tags ?? []

  return (
    <article
      className={cn(
        'group relative overflow-hidden cursor-pointer',
        'border transition-all duration-200 ease-out',
        'hover:-translate-y-[3px] hover:bg-white/[0.04] active:scale-[0.98]',
        className,
      )}
      style={{
        borderColor: 'rgba(255,255,255,0.14)',
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      {/* Stretched link — covers entire card at z-[1] */}
      <Link href={`/post/${slug}`} className="absolute inset-0 z-[1]" aria-label={title} />

      {/* Cover — pointer-events-none: clicks fall through to stretched link */}
      <div
        className="relative overflow-hidden pointer-events-none"
        style={{ height: '188px' }}
      >
        {coverImageKey ? (
          <Image
            src={getPostUrl(coverImageKey)}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: placeholderGradient }} />
        )}
      </div>

      {/* Content — z-[2] pointer-events-none; interactive children override to auto */}
      <div
        className="relative z-[2] flex flex-col gap-[9px] pointer-events-none"
        style={{ padding: '18px 18px 22px' }}
      >
        {/* Categories row — pointer-events-auto so they capture clicks */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-[8px] pointer-events-auto">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/search?cat=${cat.slug}`}
                className="chip-link font-nav font-bold text-[11px] tracking-[0.10em] uppercase"
                style={{ color: 'var(--color-accent)' }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Title — not a link; clicks fall through to stretched link */}
        <h3
          className="font-display font-bold lowercase"
          style={{ fontSize: '22px', lineHeight: '1.08', color: 'var(--color-text)' }}
        >
          {title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p
            className="font-body"
            style={{ fontWeight: 200, fontSize: '15px', lineHeight: '1.5', color: 'rgba(255,255,255,0.6)' }}
          >
            {excerpt}
          </p>
        )}

        {/* Date + tags row — pointer-events-none on wrapper; tag links override to auto */}
        {(date || tagList.length > 0) && (
          <div
            className="font-nav font-medium text-[11px] tracking-[0.06em] uppercase flex flex-wrap items-center gap-[6px]"
            style={{ color: 'var(--color-caption-faint)', marginTop: '3px' }}
          >
            {date && <span>{date}</span>}
            {tagList.map((tag, i) => (
              <Fragment key={tag.id}>
                {(!!date || i > 0) && <span aria-hidden>·</span>}
                <Link
                  href={`/search?tag=${tag.slug}`}
                  className="chip-link pointer-events-auto"
                  style={{ color: 'var(--color-caption-faint)' }}
                >
                  {tag.name}
                </Link>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all 5 tests pass (4 existing + 1 new).

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/MediaCard.tsx src/shared/ui/__tests__/MediaCard.test.tsx
git commit -m "feat: fix card clickability, move tags to date row, add chip-link animation"
```

---

### Task 3: Hero Section — Stretched-Link + Clickable Category/Tag Chips

**Files:**
- Modify: `src/app/(public)/page.tsx`

**Interfaces:**
- Consumes: `chip-link` CSS class (Task 1), `featured.categories`, `featured.tags` from existing query
- Produces: hero with stretched link for post navigation + individual category/tag links

**Key change:** The outer `<Link>` wrapper around the hero is removed. A stretched `<Link className="absolute inset-0 z-[1]">` replaces it. The text block has `pointer-events-none`; the chips row has `pointer-events-auto` for its links.

- [ ] **Step 1: Remove `heroLabel` computation and restructure hero in page.tsx**

In `src/app/(public)/page.tsx`, make these changes:

**A. Remove the `heroLabel` const** (line ~23-25):
```ts
// DELETE this line:
const heroLabel = featured
  ? [...featured.categories.map(c => c.name), ...featured.tags.map(t => t.name)].join(' · ')
  : null
```

**B. Replace the entire `{featured && (...)}` section** with:

```tsx
{featured && (
  <section>
    {/* ── Full-width banner hero ── */}
    <div
      className="group relative overflow-hidden"
      style={{ minHeight: 'clamp(420px, 52vh, 580px)' }}
    >
      {/* Cover / gradient background */}
      {featured.coverImageKey ? (
        <Image
          src={getPostUrl(featured.coverImageKey)}
          alt={featured.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: HERO_GRADIENT }} />
      )}

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(14,10,11,0.92) 50%, rgba(14,10,11,0.25) 100%)',
        }}
      />

      {/* Stretched link for post navigation */}
      <Link
        href={`/post/${featured.slug}`}
        className="absolute inset-0 z-[1]"
        aria-label={featured.title}
      />

      {/* Logo centered — pointer-events-none */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-white.svg" alt="PHL·ART" width={42} height={42} className="logo-dark" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-black.svg" alt="" width={42} height={42} aria-hidden className="logo-light" />
      </div>

      {/* Text at bottom — pointer-events-none wrapper */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-[2]"
        style={{ padding: '0 44px 36px' }}
      >
        {/* Category/tag chips — pointer-events-auto so they intercept clicks */}
        {(featured.categories.length > 0 || featured.tags.length > 0) && (
          <div
            className="flex flex-wrap gap-3 pointer-events-auto"
            style={{ marginBottom: '14px' }}
          >
            {featured.categories.map(cat => (
              <Link
                key={cat.id}
                href={`/search?cat=${cat.slug}`}
                className="chip-link font-nav font-bold text-[12px] tracking-[0.12em] uppercase"
                style={{ color: 'var(--color-accent)' }}
              >
                {cat.name}
              </Link>
            ))}
            {featured.tags.map(tag => (
              <Link
                key={tag.id}
                href={`/search?tag=${tag.slug}`}
                className="chip-link font-nav font-bold text-[12px] tracking-[0.12em] uppercase"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Title — not a link; clicks fall to stretched link */}
        <h1
          className="font-display font-bold lowercase"
          style={{
            fontSize: 'clamp(30px, 3.8vw, 58px)',
            lineHeight: '1.0',
            letterSpacing: '-0.015em',
            color: 'var(--color-text)',
            margin: '0 0 14px',
          }}
        >
          {featured.title}
        </h1>

        {heroExcerpt && (
          <p
            className="font-body hidden md:block"
            style={{
              fontWeight: 300,
              fontSize: '17px',
              lineHeight: '1.65',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '14px',
              maxWidth: '52ch',
            }}
          >
            {heroExcerpt}
          </p>
        )}

        {featured.publishedAt && (
          <div
            className="font-nav font-medium text-[11px] tracking-[0.06em] uppercase"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            {formatDate(featured.publishedAt)}
          </div>
        )}
      </div>
    </div>
  </section>
)}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass (page.tsx has no unit tests; verifying no TypeScript regressions is enough).

- [ ] **Step 3: Commit**

```bash
git add src/app/(public)/page.tsx
git commit -m "feat: restructure hero to stretched-link with clickable category/tag chips"
```

---

### Task 4: Post Page — Add chip-link Class to Category/Tag Links

**Files:**
- Modify: `src/app/(public)/post/[postSlug]/page.tsx`

**Interfaces:**
- Consumes: `chip-link` CSS class (Task 1)

- [ ] **Step 1: Add chip-link class and remove hover:opacity-70 from post page links**

In `src/app/(public)/post/[postSlug]/page.tsx`, find the block rendering category/tag links (around line 107-123). Replace it:

```tsx
{(post.categories.length > 0 || post.tags.length > 0) && (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{ marginBottom: '16px' }}>
    {post.categories.map(cat => (
      <Link
        key={cat.id}
        href={`/search?cat=${cat.slug}`}
        className="chip-link font-nav font-bold text-[12px] tracking-[0.12em] uppercase"
        style={{ color: 'var(--color-accent)' }}
      >
        {cat.name}
      </Link>
    ))}
    {post.tags.map(tag => (
      <Link
        key={tag.id}
        href={`/search?tag=${tag.slug}`}
        className="chip-link font-nav font-bold text-[12px] tracking-[0.12em] uppercase"
        style={{ color: 'var(--color-caption)' }}
      >
        {tag.name}
      </Link>
    ))}
  </div>
)}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/(public)/post/[postSlug]/page.tsx
git commit -m "feat: add chip-link animation to post page category/tag links"
```

---

### Task 5: Data Layer — getRecentPosts Offset + API Pagination Route

**Files:**
- Modify: `src/entities/post/queries.ts`
- Create: `src/app/api/posts/route.ts`

**Interfaces:**
- Produces:
  - `getRecentPosts(limit: number, offset?: number): Promise<PostPreview[]>` — unchanged signature at call sites (offset defaults to 0)
  - `GET /api/posts?page=N&limit=12` → `{ posts: PostPreview[], hasMore: boolean }`

- [ ] **Step 1: Add `offset` parameter to `getRecentPosts`**

In `src/entities/post/queries.ts`, replace the `getRecentPosts` function:

```ts
export async function getRecentPosts(limit: number, offset = 0): Promise<PostPreview[]> {
  return prisma.post.findMany({
    where: { status: 'PUBLISHED', isFeatured: false },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    skip: offset,
    select: postPreviewSelect,
  })
}
```

Existing callers pass only `limit` — the default `offset = 0` makes this backward-compatible.

- [ ] **Step 2: Run tests to confirm no regressions**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Create the /api/posts pagination route**

Create `src/app/api/posts/route.ts`:

```ts
import { NextRequest } from 'next/server'
import { getRecentPosts } from '@/entities/post/queries'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(40, Math.max(1, Number(searchParams.get('limit') ?? 12)))
  const offset = (page - 1) * limit

  // Fetch one extra to know if more pages exist
  const all = await getRecentPosts(limit + 1, offset)
  const hasMore = all.length > limit
  const posts = all.slice(0, limit)

  return Response.json({ posts, hasMore })
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/entities/post/queries.ts src/app/api/posts/route.ts
git commit -m "feat: add offset to getRecentPosts + /api/posts pagination route"
```

---

### Task 6: PostsInfiniteGrid — Client Component with IntersectionObserver

**Files:**
- Create: `src/features/posts/ui/PostsInfiniteGrid.tsx`

**Interfaces:**
- Consumes:
  - `MediaCard` from `@/shared/ui`
  - `CARD_GRADIENTS` from `@/shared/lib/gradients`
  - `GET /api/posts?page=N&limit=12` (Task 5)
- Produces:
  - `PostsInfiniteGrid({ initialPosts: PostPreview[], initialHasMore: boolean }): JSX.Element`
  - API response type alias: `ApiPost = Omit<PostPreview, 'publishedAt'> & { publishedAt: string | null }`

**Note:** The API returns JSON — `publishedAt` arrives as an ISO string. Convert with `new Date(post.publishedAt)` before passing to `MediaCard`. `formatDate` already accepts strings but `MediaCard`'s prop type is `Date | null`.

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "src/features/posts/ui"
```

- [ ] **Step 2: Create PostsInfiniteGrid.tsx**

Create `src/features/posts/ui/PostsInfiniteGrid.tsx`:

```tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MediaCard } from '@/shared/ui'
import { CARD_GRADIENTS } from '@/shared/lib/gradients'
import type { PostPreview } from '@/entities/post/types'

type ApiPost = Omit<PostPreview, 'publishedAt'> & { publishedAt: string | null }

interface Props {
  initialPosts: PostPreview[]
  initialHasMore: boolean
}

export function PostsInfiniteGrid({ initialPosts, initialHasMore }: Props) {
  const [posts, setPosts] = useState<PostPreview[]>(initialPosts)
  const [page, setPage] = useState(2)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/posts?page=${page}&limit=12`)
      if (!res.ok) return
      const data: { posts: ApiPost[]; hasMore: boolean } = await res.json()
      const normalized: PostPreview[] = data.posts.map(p => ({
        ...p,
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
      }))
      setPosts(prev => [...prev, ...normalized])
      setPage(p => p + 1)
      setHasMore(data.hasMore)
    } finally {
      setIsLoading(false)
    }
  }, [page, isLoading, hasMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-5 md:px-11"
        style={{ gap: '16px', paddingBottom: '52px' }}
      >
        {posts.map((post, i) => (
          <MediaCard
            key={post.id}
            title={post.title}
            slug={post.slug}
            coverImageKey={post.coverImageKey}
            publishedAt={post.publishedAt}
            categories={post.categories}
            tags={post.tags}
            placeholderGradient={CARD_GRADIENTS[i % CARD_GRADIENTS.length]}
          />
        ))}
      </div>

      {/* Sentinel — observed by IntersectionObserver to trigger next page load */}
      {hasMore && (
        <div ref={sentinelRef} style={{ height: '1px' }} aria-hidden />
      )}

      {/* Loading skeleton — 3 pulsing placeholder cards */}
      {isLoading && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-5 md:px-11"
          style={{ gap: '16px', paddingBottom: '52px' }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse border"
              style={{
                height: '280px',
                borderColor: 'rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.03)',
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass (no unit tests for this component — IntersectionObserver mocking is out of scope; visual verification in Task 7 Step 3).

- [ ] **Step 5: Commit**

```bash
git add src/features/posts/ui/PostsInfiniteGrid.tsx
git commit -m "feat: add PostsInfiniteGrid client component with IntersectionObserver"
```

---

### Task 7: /posts Page + Homepage "Все →" Link Update

**Files:**
- Create: `src/app/(public)/posts/page.tsx`
- Modify: `src/app/(public)/page.tsx` (one line: `href="/search"` → `href="/posts"`)

**Interfaces:**
- Consumes:
  - `getRecentPosts(limit, offset)` from Task 5
  - `PostsInfiniteGrid` from Task 6

- [ ] **Step 1: Create /posts server page**

Create `src/app/(public)/posts/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { getRecentPosts } from '@/entities/post/queries'
import { PostsInfiniteGrid } from '@/features/posts/ui/PostsInfiniteGrid'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Все материалы — PHL·ART',
  description: 'Полный архив материалов: фото, кино, подкасты, тексты.',
}

const LIMIT = 12

export default async function PostsPage() {
  // Fetch one extra to determine hasMore without a separate count query
  const all = await getRecentPosts(LIMIT + 1, 0)
  const hasMore = all.length > LIMIT
  const posts = all.slice(0, LIMIT)

  return (
    <div style={{ background: 'var(--color-bg)' }}>
      {/* Page heading */}
      <div style={{ padding: '52px 44px 36px' }}>
        <h1
          className="font-display font-bold lowercase"
          style={{
            fontSize: 'clamp(48px, 6vw, 80px)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          все материалы
        </h1>
      </div>

      {posts.length > 0 ? (
        <PostsInfiniteGrid initialPosts={posts} initialHasMore={hasMore} />
      ) : (
        <p
          className="font-nav font-medium text-[13px] tracking-[0.06em] uppercase text-center"
          style={{ paddingTop: '80px', color: 'var(--color-caption)' }}
        >
          Публикации появятся здесь
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update homepage "все →" link**

In `src/app/(public)/page.tsx`, find the `<Link href="/search"` that shows "все →" (around line 163). Change `href="/search"` to `href="/posts"`.

The line reads:
```tsx
<Link
  href="/search"
  className="font-nav font-semibold text-[13px] tracking-[0.06em] uppercase flex-shrink-0"
  style={{ color: 'var(--color-accent)', marginTop: '20px' }}
>
  все →
</Link>
```

Change to:
```tsx
<Link
  href="/posts"
  className="font-nav font-semibold text-[13px] tracking-[0.06em] uppercase flex-shrink-0"
  style={{ color: 'var(--color-accent)', marginTop: '20px' }}
>
  все →
</Link>
```

- [ ] **Step 3: Run tests + TypeScript check**

```bash
npm test && npx tsc --noEmit 2>&1 | head -10
```

Expected: all tests pass, 0 TypeScript errors.

- [ ] **Step 4: Manual smoke test checklist**

Start `npm run dev` and verify:

1. `http://localhost:3000` → Hero: clicking category/tag label navigates to `/search?cat=...` or `/search?tag=...` (not the post)
2. `http://localhost:3000` → Clicking anywhere on a MediaCard (title, date, cover) navigates to the post
3. `http://localhost:3000` → Hover on category/tag chip: underline animates left-to-right
4. `http://localhost:3000` → Hover on card: subtle background highlight, cursor is pointer
5. `http://localhost:3000` → "все →" navigates to `/posts`
6. `http://localhost:3000/posts` → Renders heading + initial 12 cards
7. `http://localhost:3000/posts` → Scroll to bottom → new cards load automatically
8. `http://localhost:3000/post/raydery-utrachennogo-avangarda` → Category/tag chips animate on hover

- [ ] **Step 5: Commit**

```bash
git add src/app/(public)/posts/page.tsx src/app/(public)/page.tsx
git commit -m "feat: add /posts infinite-scroll page and update homepage link"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Fix card clickability (pointer-events) | Task 2 |
| cursor-pointer on article | Task 2 |
| Hover background highlight on card | Task 2 |
| Tags in date row (right of date, · separator) | Task 2 |
| chip-link hover animation (left-to-right underline) | Task 1 + Tasks 2, 3, 4 |
| Hero: remove outer Link, add stretched link | Task 3 |
| Hero: individual category/tag chip links | Task 3 |
| Post page: chip-link on category/tag links | Task 4 |
| getRecentPosts offset param | Task 5 |
| /api/posts pagination route | Task 5 |
| PostsInfiniteGrid client component | Task 6 |
| /posts server page | Task 7 |
| Homepage "все →" → /posts | Task 7 |

**No placeholders.** All steps include exact code.

**Type consistency:**
- `getRecentPosts(limit, offset?)` defined in Task 5, consumed in Tasks 6, 7 — same signature ✅
- `PostsInfiniteGrid({ initialPosts, initialHasMore })` defined in Task 6, consumed in Task 7 — same props ✅
- `ApiPost = Omit<PostPreview, 'publishedAt'> & { publishedAt: string | null }` used only inside Task 6 ✅
