# Card UX & /posts Page — Design Spec

**Date:** 2026-06-27
**Scope:** UX fixes for MediaCard, Hero, category/tag chips, and new /posts infinite-scroll page.

---

## 1. MediaCard — Fix Card Clickability

**Problem:** Stretched link at `z-0`, content wrapper at `z-10`. The content `<div>` intercepts all pointer events but isn't a link, so clicking on the title or date does nothing.

**Solution:**
- Add `pointer-events-none` to the content `<div>` (all clicks fall through to stretched link below)
- Add `pointer-events-auto` explicitly on interactive inner elements (category links, tag links)
- Raise stretched link to `z-[1]`; content stays at `z-[2]` (with `pointer-events-none`)
- Add `cursor-pointer` to `<article>` so pointer is correct anywhere on the card
- Add hover background: `hover:bg-white/[0.06] dark:hover:bg-white/[0.06]` via Tailwind or inline transition

**Result:** Clicking anywhere on the card (title, date, cover, excerpt) navigates to the post. Clicking a category/tag chip navigates to the search page.

---

## 2. MediaCard — Tags Placement

**Current:** Two separate rows (categories row, tags row) — visually ambiguous.

**New layout (top → bottom):**
1. **Categories row** — accent color (`var(--color-accent)`), each a `<Link href="/search?cat=slug">`
2. **Title** — `h3`, Manrope 700, 22px lowercase
3. **Excerpt** — optional, Jost 300
4. **Date + tags row** — single line: `{date} · {tag1} · {tag2}` where date is plain text and each tag is a `<Link href="/search?tag=slug">` with `var(--color-caption-faint)` color

The `·` separator between date and tags is a plain `<span>` in caption-faint color. Tags use the same font-nav style as the date.

---

## 3. Category/Tag Chip Hover Animation

**Target elements:** All `<Link>` elements that represent categories or tags anywhere in the UI (MediaCard, post page header, hero section).

**CSS class:** `.chip-link` added to `src/styles/globals.css`

```css
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

Applied via `className="chip-link ..."` on every category/tag `<Link>`. The `currentColor` inherits from the link's `color` style — accent for categories, caption for tags.

Remove the existing `hover:opacity-70` from these links (replaced by the underline animation).

---

## 4. Hero Section — Clickable Category/Tag Chips

**Problem:** The hero in `src/app/(public)/page.tsx` wraps the entire section in a `<Link>`. Inner `<Link>` elements for category/tag chips would create invalid nested anchors.

**Solution — stretched-link pattern (same as MediaCard):**

```
<section>
  <div class="group relative overflow-hidden" style={{ minHeight: 'clamp(...)' }}>
    {/* Background: cover image or CSS gradient */}
    {/* Dark overlay: pointer-events-none */}
    
    {/* Stretched link for post navigation */}
    <Link href="/post/slug" class="absolute inset-0 z-[1]" aria-label={title} />
    
    {/* Logo: centered, pointer-events-none */}
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <img src="/logo-white.svg" .../>
    </div>
    
    {/* Text block: pointer-events-none container */}
    <div class="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ padding: '0 44px 36px' }}>
      {/* Category/tag chips: pointer-events-auto individually */}
      <div class="flex flex-wrap gap-3 pointer-events-auto" style={{ marginBottom: '14px' }}>
        {featured.categories.map(cat => (
          <Link class="chip-link ..." href="/search?cat=slug">{cat.name}</Link>
        ))}
        {featured.tags.map(tag => (
          <Link class="chip-link ..." href="/search?tag=slug">{tag.name}</Link>
        ))}
      </div>
      {/* Title and date: not links, clicks pass through to stretched link */}
      <h1>{title}</h1>
      <div>{date}</div>
    </div>
  </div>
</section>
```

The outer `<Link>` wrapper is removed. The stretched link at `z-[1]` captures clicks on non-interactive areas (title, date, cover, logo). Category/tag chips at `pointer-events-auto` intercept their own clicks before they reach the stretched link.

---

## 5. "Все →" Link on Homepage

Change `href="/search"` → `href="/posts"` on the homepage "все →" link in `src/app/(public)/page.tsx`.

---

## 6. New Page: /posts (All Posts, Infinite Scroll)

### Architecture

```
src/app/(public)/posts/
  page.tsx                          ← Server Component: fetch first 12 posts, render title + initial grid

src/features/posts/
  ui/
    PostsInfiniteGrid.tsx           ← Client Component: manages infinite scroll state

src/app/api/posts/
  route.ts                          ← API route: GET /api/posts?page=N&limit=12

src/entities/post/queries.ts        ← Update getRecentPosts to accept offset param
```

### Data Flow

1. `posts/page.tsx` calls `getRecentPosts(12, 0)` (first page, no offset).
2. Renders `<PostsInfiniteGrid initialPosts={posts} initialHasMore={total > 12} />`
3. `PostsInfiniteGrid` attaches an `IntersectionObserver` to a sentinel `<div>` at the bottom of the list.
4. When sentinel enters viewport: fetch `/api/posts?page=N&limit=12`, append to state.
5. When API returns fewer than 12 results: set `hasMore = false`, hide sentinel.

### API Route: `/api/posts`

```ts
// GET /api/posts?page=1&limit=12
// Returns: { posts: PostPreview[], hasMore: boolean }
```

- `page` defaults to 1, `limit` defaults to 12 (capped at 40)
- Uses existing `getRecentPosts` with `offset = (page - 1) * limit`
- Returns `{ posts, hasMore: posts.length === limit }`

### `getRecentPosts` Update

```ts
export async function getRecentPosts(limit = 12, offset = 0): Promise<PostPreview[]>
```

Add `skip: offset` to the existing Prisma query. Non-breaking — existing callers that don't pass `offset` get `0` by default.

### `/posts` Page Layout

- Page heading: `"все материалы"` — Manrope 700, same style as category headings
- Same 3-column card grid as the homepage recent posts section: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, gap 16px, padding `px-5 md:px-11`
- `CARD_GRADIENTS` cycled by index for placeholder backgrounds (same as homepage)
- Loading indicator: minimal — a subtle pulsing row of 3 gradient placeholder cards (`animate-pulse`) while fetching

### `PostsInfiniteGrid` Client Component

```tsx
'use client'
// Props: initialPosts: PostPreview[], initialHasMore: boolean
// State: posts (starts as initialPosts), page (starts at 2), isLoading, hasMore
// Effect: IntersectionObserver on sentinelRef → calls loadMore()
// loadMore: fetch /api/posts?page=N, spread new posts into state, advance page
// Renders: card grid + sentinel div + optional loading skeleton
```

The component does NOT use `useEffect` for the initial fetch — that's handled by the server page. It only fetches subsequent pages.

---

## Files Changed / Created

| File | Action |
|---|---|
| `src/styles/globals.css` | Add `.chip-link` animation class |
| `src/shared/ui/MediaCard.tsx` | Fix pointer-events, move tags to date row, add chip-link, cursor-pointer, hover bg |
| `src/app/(public)/page.tsx` | Restructure hero to stretched-link, fix category/tag chips, update "все →" link |
| `src/app/(public)/post/[postSlug]/page.tsx` | Add chip-link class to category/tag links |
| `src/entities/post/queries.ts` | Add `offset` param to `getRecentPosts` |
| `src/app/api/posts/route.ts` | Create pagination API route (new file) |
| `src/features/posts/ui/PostsInfiniteGrid.tsx` | Create infinite scroll client component (new file) |
| `src/app/(public)/posts/page.tsx` | Create /posts server page (new file) |

---

## Constraints

- All new Server Components: no event handlers, no `useState`/`useEffect`
- `PostsInfiniteGrid` must be `'use client'`; API route must be a Next.js Route Handler
- Colors via CSS variables only — no hardcoded hex except gradients
- Font classes: `font-display`, `font-nav`, `font-body`
- `CARD_GRADIENTS` imported from `@/shared/lib/gradients`
- `MediaCard` remains a Server Component — no `'use client'` directive
