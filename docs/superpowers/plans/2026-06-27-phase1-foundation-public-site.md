# Phase 1: Foundation + Public Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать полностью рабочий публичный сайт PHL·ART (4 страницы + API) на Next.js 14 с дизайн-системой бренда, готовый к деплою на art.ph1l74.com.

**Architecture:** Единое Next.js 14 App Router приложение, два route group'а `(public)` и `(admin)`. Публичные страницы используют ISR (revalidate 60–300s) + on-demand revalidation. Дизайн-система — FSD-lite: `shared/ui` для примитивов, `entities/` для доменных типов и запросов.

**Tech Stack:** Next.js 14, TypeScript 5 (strict), Tailwind CSS 3, Prisma 5, PostgreSQL, Vitest + @testing-library/react, DOMPurify, Docker.

## Global Constraints

- Node.js ≥ 20
- TypeScript strict mode (`"strict": true` в tsconfig)
- Default тема: `dark` (`data-theme="dark"` на `<html>` при первом посещении)
- Весь текстовый UI на русском языке
- Hit-targets ≥ 44px на мобайле
- ISR: главная и категории `revalidate: 60`, страница поста `revalidate: 300`
- `next/image` обязателен для всех изображений с S3
- PostgreSQL и Traefik — внешние, не поднимаются в docker-compose этого проекта
- `DATABASE_URL` писать строкой целиком без переменных внутри (docker env_file не поддерживает интерполяцию)
- Домен: `art.ph1l74.com`
- S3 path-style URL: `https://<S3_ENDPOINT>/<S3_BUCKET>/<s3Key>`

---

## File Map

```
prisma/
  schema.prisma

scripts/
  setup-s3-cors.sh

src/
  app/
    layout.tsx
    (public)/
      layout.tsx
      page.tsx
      [categorySlug]/page.tsx
      post/[postSlug]/page.tsx
      search/page.tsx
    (admin)/
      layout.tsx
      login/page.tsx
    api/
      health/route.ts
      search/route.ts
      revalidate/route.ts
  entities/
    post/
      types.ts
      queries.ts
      ui/
        BlockRenderer/
          index.tsx
          TextBlock.tsx
          PhotoBlock.tsx
          PhotoGridBlock.tsx
          PanoramaBlock.tsx
          EmbedBlock.tsx
          QuoteBlock.tsx
          HeadingBlock.tsx
        __tests__/BlockRenderer.test.tsx
    category/
      types.ts
      queries.ts
    tag/
      types.ts
  shared/
    lib/
      prisma.ts
      transliterate.ts
      getPostUrl.ts
      cn.ts
      search.ts
      __tests__/
        transliterate.test.ts
        getPostUrl.test.ts
    ui/
      Logo.tsx
      GradientSurface.tsx
      SectionTitle.tsx
      NavLine.tsx
      Tag.tsx
      Rating.tsx
      ThemeToggle.tsx
      ReadingProgress.tsx
      MediaCard.tsx
      SocialLinks.tsx
      Header.tsx
      Footer.tsx
      BottomNav.tsx
      index.ts
      __tests__/MediaCard.test.tsx
  styles/
    globals.css

next.config.ts (или next.config.js — использовать то что создал scaffold)
tailwind.config.ts
vitest.config.ts
vitest.setup.ts
.env.example
Dockerfile
docker-compose.yml
```

---

## Task 1: Project Scaffold

**ВЫПОЛНЕНО** — scaffold готов, Next.js 14 + Vitest настроены.

---

## Task 2: Design Tokens + Шрифты

> **Дизайн-рефы (локальные, не в git):** перед реализацией прочитать:
> - `docs/refs/designs/_ds/phl-art-design-system-71295445-053a-4245-9202-aa485ae8d946/tokens/colors.css`
> - `docs/refs/designs/_ds/phl-art-design-system-71295445-053a-4245-9202-aa485ae8d946/tokens/typography.css`
> - `docs/refs/designs/_ds/phl-art-design-system-71295445-053a-4245-9202-aa485ae8d946/tokens/spacing.css`
> - `docs/refs/designs/_ds/phl-art-design-system-71295445-053a-4245-9202-aa485ae8d946/tokens/effects.css`
> - `docs/refs/designs/_ds/phl-art-design-system-71295445-053a-4245-9202-aa485ae8d946/styles.css`
>
> Значения CSS-переменных брать **оттуда**, код ниже — только шаблон структуры.

**Files:**
- Modify: `src/styles/globals.css`
- Modify: `tailwind.config.ts`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: CSS-переменные `--color-bg`, `--color-accent`, etc. доступны во всём приложении; шрифты загружены; `data-theme` переключает тему

- [ ] **Шаг 1: Прочитать токены из дизайн-рефов** (папка `docs/refs/designs/_ds/.../tokens/`) и записать точные значения переменных

- [ ] **Шаг 2: Обновить `src/styles/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root[data-theme="dark"] {
  --color-bg:        #0e0a0b;
  --color-bg-footer: #0a0708;
  --color-text:      #ffffff;
  --color-text-body: rgba(255, 255, 255, 0.82);
  --color-caption:   rgba(255, 255, 255, 0.55);
  --color-accent:    #ff3b30;
  --color-hairline:  rgba(255, 255, 255, 0.12);
  --color-glass:     rgba(255, 255, 255, 0.04);
}

:root[data-theme="light"] {
  --color-bg:        #f4f1f1;
  --color-bg-footer: #ffffff;
  --color-text:      #1a1416;
  --color-text-body: #2a2426;
  --color-caption:   #797575;
  --color-accent:    #ff0000;
  --color-hairline:  rgba(0, 0, 0, 0.1);
  --color-glass:     transparent;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
}
```

- [ ] **Шаг 3: Обновить `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       'var(--color-bg)',
        footer:   'var(--color-bg-footer)',
        text:     'var(--color-text)',
        body:     'var(--color-text-body)',
        caption:  'var(--color-caption)',
        accent:   'var(--color-accent)',
        hairline: 'var(--color-hairline)',
        glass:    'var(--color-glass)',
      },
      fontFamily: {
        display:   ['var(--font-display)', 'sans-serif'],
        body:      ['var(--font-body)', 'sans-serif'],
        nav:       ['var(--font-nav)', 'sans-serif'],
        editorial: ['var(--font-editorial)', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Шаг 4: Обновить `src/app/layout.tsx`** — подключить Google Fonts и inline-скрипт темы

```tsx
import type { Metadata } from 'next'
import { Manrope, Jost, Montserrat, Lora } from 'next/font/google'
import '@/styles/globals.css'

const manrope = Manrope({ subsets: ['latin', 'cyrillic'], weight: ['700'], variable: '--font-display' })
const jost = Jost({ subsets: ['latin', 'cyrillic'], weight: ['200', '300'], variable: '--font-body' })
const montserrat = Montserrat({ subsets: ['latin', 'cyrillic'], weight: ['600', '700'], variable: '--font-nav' })
const lora = Lora({ subsets: ['latin', 'cyrillic'], style: ['italic'], variable: '--font-editorial' })

export const metadata: Metadata = {
  title: 'PHL·ART',
  description: 'Кураторская медиа-платформа',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t)})()`,
          }}
        />
      </head>
      <body className={`${manrope.variable} ${jost.variable} ${montserrat.variable} ${lora.variable}`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Шаг 5: Проверить что шрифты и тема применяются**

```bash
npm run dev
```
Открыть `http://localhost:3000`. В DevTools: `<html data-theme="dark">`, в Computed стилях body видны CSS-переменные.

- [ ] **Шаг 6: Коммит**

```bash
git add src/styles/globals.css tailwind.config.ts src/app/layout.tsx
git commit -m "feat: design tokens, CSS theme vars, Google Fonts"
```

---

## Task 3: Prisma Schema + Migration

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/shared/lib/prisma.ts`
- Create: `.env.example`

**Interfaces:**
- Produces: `prisma` singleton, типы из `@prisma/client`

- [ ] **Шаг 1: Инициализировать Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Шаг 2: Написать `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum PostStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
}

model Post {
  id            String      @id @default(cuid())
  title         String
  slug          String      @unique
  body          Json
  coverImageKey String?
  isFeatured    Boolean     @default(false)
  status        PostStatus  @default(DRAFT)
  publishedAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  categories    Category[]  @relation("PostCategories")
  tags          Tag[]       @relation("PostTags")
  socialLinks   SocialLink[]
}

model Category {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  gradientCss String?
  order       Int      @default(0)
  posts       Post[]   @relation("PostCategories")
}

model Tag {
  id    String @id @default(cuid())
  name  String
  slug  String @unique
  posts Post[] @relation("PostTags")
}

model Social {
  id        String       @id @default(cuid())
  name      String
  slug      String       @unique
  iconUrl   String?
  createdAt DateTime     @default(now())
  links     SocialLink[]
}

model SocialLink {
  id        String   @id @default(cuid())
  url       String
  postId    String
  socialId  String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  social    Social   @relation(fields: [socialId], references: [id])
  createdAt DateTime @default(now())

  @@unique([postId, socialId])
}
```

- [ ] **Шаг 3: Создать `src/shared/lib/prisma.ts`**

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['query'] : [] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Шаг 4: Создать `.env.example`**

```env
# База данных (общая для портала — писать строку целиком, без интерполяции ${})
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# ISR on-demand revalidation secret
REVALIDATE_SECRET=""   # openssl rand -base64 32

# S3
S3_ENDPOINT=""         # хост без протокола: s3.firstvds.ru
S3_REGION="default"
S3_BUCKET=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""

# NextAuth
NEXTAUTH_SECRET=""     # openssl rand -base64 32
NEXTAUTH_URL="https://art.ph1l74.com"
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
ADMIN_ALLOWLIST=""
```

- [ ] **Шаг 5: Сгенерировать Prisma Client** (`DATABASE_URL` нужен в `.env`)

```bash
npx prisma generate
```

- [ ] **Шаг 6: Применить миграцию**

```bash
npx prisma migrate dev --name init
```

- [ ] **Шаг 7: Коммит**

```bash
git add prisma/ src/shared/lib/prisma.ts .env.example
git commit -m "feat: Prisma schema with Post, Category, Tag, Social, SocialLink"
```

---

## Task 4: TypeScript Types

**Files:**
- Create: `src/entities/post/types.ts`
- Create: `src/entities/category/types.ts`
- Create: `src/entities/tag/types.ts`

**Interfaces:**
- Produces: `Block`, `PostPreview`, `PostFull`, `CategoryHeroBg`

- [ ] **Шаг 1: Создать `src/entities/post/types.ts`**

```ts
import type { Post, Category, Tag, Social, SocialLink } from '@prisma/client'

export type TextBlock      = { type: 'text';      html: string }
export type PhotoBlock     = { type: 'photo';     s3Key: string; caption?: string }
export type PhotoGridBlock = { type: 'photoGrid'; columns: 2 | 3; photos: { s3Key: string; caption?: string }[] }
export type PanoramaBlock  = { type: 'panorama';  s3Key: string; caption?: string }
export type EmbedBlock     = { type: 'embed';     html: string }
export type QuoteBlock     = { type: 'quote';     text: string; author?: string }
export type HeadingBlock   = { type: 'heading';   level: 2 | 3; text: string }

export type Block =
  | TextBlock | PhotoBlock | PhotoGridBlock | PanoramaBlock
  | EmbedBlock | QuoteBlock | HeadingBlock

export type PostPreview = Pick<Post, 'id' | 'title' | 'slug' | 'coverImageKey' | 'publishedAt' | 'isFeatured'> & {
  categories: Pick<Category, 'id' | 'name' | 'slug'>[]
}

export type PostFull = Post & {
  categories: Pick<Category, 'id' | 'name' | 'slug'>[]
  tags: Pick<Tag, 'id' | 'name' | 'slug'>[]
  socialLinks: (SocialLink & { social: Pick<Social, 'id' | 'name' | 'iconUrl'> })[]
  body: Block[]
}
```

- [ ] **Шаг 2: Создать `src/entities/category/types.ts`**

```ts
import type { Category } from '@prisma/client'

export type { Category }

export type CategoryHeroBg =
  | { type: 'image';    s3Key: string }
  | { type: 'gradient'; css: string }
  | { type: 'default' }
```

- [ ] **Шаг 3: Создать `src/entities/tag/types.ts`**

```ts
export type { Tag } from '@prisma/client'
```

- [ ] **Шаг 4: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Шаг 5: Коммит**

```bash
git add src/entities/
git commit -m "feat: TypeScript domain types for Post, Block, Category, Tag"
```

---

## Task 5: Utility Functions

**Files:**
- Create: `src/shared/lib/transliterate.ts`
- Create: `src/shared/lib/getPostUrl.ts`
- Create: `src/shared/lib/cn.ts`
- Create: `src/shared/lib/__tests__/transliterate.test.ts`
- Create: `src/shared/lib/__tests__/getPostUrl.test.ts`

**Interfaces:**
- Produces:
  - `toSlug(input: string): string`
  - `getPostUrl(s3Key: string): string`
  - `cn(...inputs: ClassValue[]): string`

- [ ] **Шаг 1: Написать тест для `toSlug`**

```ts
// src/shared/lib/__tests__/transliterate.test.ts
import { describe, it, expect } from 'vitest'
import { toSlug } from '../transliterate'

describe('toSlug', () => {
  it('транслитерирует русский текст', () => {
    expect(toSlug('Привет мир')).toBe('privet-mir')
  })
  it('строчные для латиницы', () => {
    expect(toSlug('Hello World')).toBe('hello-world')
  })
  it('смешанный текст с числами', () => {
    expect(toSlug('Топ фильмов 2025')).toBe('top-filmov-2025')
  })
  it('схлопывает пробелы', () => {
    expect(toSlug('Топ  фильмов')).toBe('top-filmov')
  })
  it('убирает дефисы по краям', () => {
    expect(toSlug(' привет ')).toBe('privet')
  })
  it('пустая строка', () => {
    expect(toSlug('')).toBe('')
  })
})
```

- [ ] **Шаг 2: Запустить — убедиться что падает**

```bash
npm test -- transliterate
```

- [ ] **Шаг 3: Реализовать `src/shared/lib/transliterate.ts`**

```ts
const MAP: Record<string, string> = {
  а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'yo',
  ж:'zh', з:'z', и:'i', й:'y', к:'k', л:'l', м:'m',
  н:'n', о:'o', п:'p', р:'r', с:'s', т:'t', у:'u',
  ф:'f', х:'kh', ц:'ts', ч:'ch', ш:'sh', щ:'shch',
  ъ:'', ы:'y', ь:'', э:'e', ю:'yu', я:'ya',
}

export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map(c => MAP[c] ?? (c.match(/[a-z0-9]/) ? c : '-'))
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
```

- [ ] **Шаг 4: Запустить — убедиться что проходит**

```bash
npm test -- transliterate
```
Ожидание: 6 tests passed

- [ ] **Шаг 5: Написать тест для `getPostUrl`**

```ts
// src/shared/lib/__tests__/getPostUrl.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('getPostUrl', () => {
  beforeEach(() => {
    vi.stubEnv('S3_ENDPOINT', 's3.firstvds.ru')
    vi.stubEnv('S3_BUCKET', 'phlart')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('строит path-style URL', async () => {
    const { getPostUrl } = await import('../getPostUrl')
    expect(getPostUrl('photos/abc123.jpg')).toBe('https://s3.firstvds.ru/phlart/photos/abc123.jpg')
  })
  it('работает с вложенными путями', async () => {
    const { getPostUrl } = await import('../getPostUrl')
    expect(getPostUrl('media/2026/cover.png')).toBe('https://s3.firstvds.ru/phlart/media/2026/cover.png')
  })
})
```

- [ ] **Шаг 6: Запустить — убедиться что падает**

```bash
npm test -- getPostUrl
```

- [ ] **Шаг 7: Реализовать `src/shared/lib/getPostUrl.ts`**

```ts
export function getPostUrl(s3Key: string): string {
  const endpoint = process.env.S3_ENDPOINT
  const bucket = process.env.S3_BUCKET
  return `https://${endpoint}/${bucket}/${s3Key}`
}
```

- [ ] **Шаг 8: Запустить — убедиться что проходит**

```bash
npm test -- getPostUrl
```
Ожидание: 2 tests passed

- [ ] **Шаг 9: Создать `src/shared/lib/cn.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Шаг 10: Коммит**

```bash
git add src/shared/lib/
git commit -m "feat: utility functions — toSlug, getPostUrl, cn"
```

---

## Task 6: Дизайн-система — Примитивы I

> **Дизайн-рефы (локальные, не в git):** перед реализацией прочитать:
> - `docs/refs/designs/_ds/phl-art-design-system-71295445-053a-4245-9202-aa485ae8d946/readme.md`
> - `docs/refs/designs/_ds/phl-art-design-system-71295445-053a-4245-9202-aa485ae8d946/styles.css`
>
> Компоненты в `_ds_bundle.js` — НЕ копировать, использовать только как визуальный референс.

**Files:**
- Create: `src/shared/ui/Logo.tsx`
- Create: `src/shared/ui/GradientSurface.tsx`
- Create: `src/shared/ui/SectionTitle.tsx`
- Create: `src/shared/ui/NavLine.tsx`
- Create: `src/shared/ui/Tag.tsx`
- Create: `src/shared/ui/Rating.tsx`

**Interfaces:**
- Consumes: `cn` из `@/shared/lib/cn`
- Produces: примитивы для использования в Header, MediaCard, страницах

- [ ] **Шаг 1: Скопировать SVG-логотипы**

```bash
cp "docs/refs/designs/assets/logo-square-white.svg" public/logo-white.svg
cp "docs/refs/designs/assets/logo-square-black.svg" public/logo-black.svg
```

- [ ] **Шаг 2: Создать `src/shared/ui/Logo.tsx`**

```tsx
import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  variant?: 'white' | 'black'
  size?: number
  href?: string
}

export function Logo({ variant = 'white', size = 36, href = '/' }: LogoProps) {
  const src = variant === 'white' ? '/logo-white.svg' : '/logo-black.svg'
  const img = <Image src={src} alt="PHL·ART" width={size} height={size} priority />
  return href ? <Link href={href}>{img}</Link> : img
}
```

- [ ] **Шаг 3: Создать `src/shared/ui/GradientSurface.tsx`**

```tsx
import { cn } from '@/shared/lib/cn'

interface GradientSurfaceProps {
  gradient?: string
  children: React.ReactNode
  className?: string
}

export function GradientSurface({ gradient, children, className }: GradientSurfaceProps) {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={gradient ? { background: gradient } : undefined}
    >
      <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none mix-blend-soft-light" aria-hidden>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      {children}
    </div>
  )
}
```

- [ ] **Шаг 4: Создать `src/shared/ui/SectionTitle.tsx`**

```tsx
import { cn } from '@/shared/lib/cn'

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('font-display font-bold text-text lowercase tracking-tight text-2xl md:text-3xl', className)}>
      {children}
    </h2>
  )
}
```

- [ ] **Шаг 5: Создать `src/shared/ui/NavLine.tsx`**

```tsx
import Link from 'next/link'
import { cn } from '@/shared/lib/cn'

interface NavItem { label: string; href: string }

export function NavLine({ items, className }: { items: NavItem[]; className?: string }) {
  return (
    <nav className={cn('flex items-center gap-2', className)}>
      {items.map((item, i) => (
        <span key={item.href} className="flex items-center gap-2">
          {i > 0 && <span className="w-1.5 h-1.5 rounded-full bg-caption" aria-hidden />}
          <Link href={item.href} className="font-nav font-semibold uppercase tracking-widest text-[11px] text-caption hover:text-text transition-colors">
            {item.label}
          </Link>
        </span>
      ))}
    </nav>
  )
}
```

- [ ] **Шаг 6: Создать `src/shared/ui/Tag.tsx`**

```tsx
import { cn } from '@/shared/lib/cn'

interface TagProps { children: React.ReactNode; href?: string; className?: string }

export function Tag({ children, href, className }: TagProps) {
  const base = cn(
    'inline-flex items-center px-2.5 py-0.5 rounded-[4px]',
    'font-nav font-semibold uppercase tracking-widest text-[9px]',
    'text-caption border border-hairline min-h-[22px]',
    className
  )
  if (href) return <a href={href} className={base}>{children}</a>
  return <span className={base}>{children}</span>
}
```

- [ ] **Шаг 7: Создать `src/shared/ui/Rating.tsx`**

```tsx
export function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 font-body text-sm text-caption">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
        <path d="M6 0l1.35 4.15H12L8.33 6.72l1.35 4.15L6 8.3l-3.68 2.57 1.35-4.15L0 4.15h4.65L6 0z" />
      </svg>
      {value}
    </span>
  )
}
```

- [ ] **Шаг 8: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Шаг 9: Коммит**

```bash
git add src/shared/ui/ public/logo-*.svg
git commit -m "feat: design system primitives — Logo, GradientSurface, SectionTitle, NavLine, Tag, Rating"
```

---

## Task 7: Интерактивные компоненты + SocialLinks

**Files:**
- Create: `src/shared/ui/ThemeToggle.tsx`
- Create: `src/shared/ui/ReadingProgress.tsx`
- Create: `src/shared/ui/SocialLinks.tsx`

- [ ] **Шаг 1: Создать `src/shared/ui/ThemeToggle.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const stored = document.documentElement.getAttribute('data-theme')
    if (stored === 'light' || stored === 'dark') setTheme(stored)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
      className="w-11 h-11 flex items-center justify-center text-caption hover:text-text transition-colors"
    >
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}
```

- [ ] **Шаг 2: Создать `src/shared/ui/ReadingProgress.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - doc.clientHeight
      setProgress(total > 0 ? Math.min(100, Math.round((doc.scrollTop / total) * 100)) : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ width: `${progress}%` }}
      className="fixed top-0 left-0 h-[3px] bg-accent z-50 transition-[width] duration-75 pointer-events-none"
    />
  )
}
```

- [ ] **Шаг 3: Создать `src/shared/ui/SocialLinks.tsx`**

```tsx
import Image from 'next/image'

interface SocialLinkItem {
  id: string
  url: string
  social: { id: string; name: string; iconUrl: string | null }
}

export function SocialLinks({ links }: { links: SocialLinkItem[] }) {
  if (links.length === 0) return null
  return (
    <aside className="mt-12 pt-8 border-t border-hairline">
      <p className="font-nav uppercase tracking-widest text-[11px] text-caption mb-4">Доступно также в</p>
      <ul className="flex flex-wrap gap-3">
        {links.map(({ id, url, social }) => (
          <li key={id}>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-[4px] border border-hairline text-caption hover:text-text hover:border-text/30 transition-colors min-h-[44px]">
              {social.iconUrl && <Image src={social.iconUrl} alt="" width={16} height={16} />}
              <span className="font-nav font-semibold uppercase tracking-widest text-[11px]">{social.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
```

- [ ] **Шаг 4: Коммит**

```bash
git add src/shared/ui/ThemeToggle.tsx src/shared/ui/ReadingProgress.tsx src/shared/ui/SocialLinks.tsx
git commit -m "feat: interactive UI — ThemeToggle, ReadingProgress, SocialLinks"
```

---

## Task 8: MediaCard

> **Дизайн-рефы (локальные, не в git):**
> - `docs/refs/screenshots/01-главная.png` — карточки в сетке
> - `docs/refs/screenshots/03-раздел-фото.png` — карточки в разделе
> - `docs/refs/screenshots/02-главная-мобильная.png` — мобайл

**Files:**
- Create: `src/shared/ui/MediaCard.tsx`
- Create: `src/shared/ui/__tests__/MediaCard.test.tsx`

**Interfaces:**
- Produces: `MediaCard({ title, slug, coverImageKey?, publishedAt, categories })`

- [ ] **Шаг 1: Написать тест**

```tsx
// src/shared/ui/__tests__/MediaCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MediaCard } from '../MediaCard'

vi.mock('@/shared/lib/getPostUrl', () => ({
  getPostUrl: (key: string) => `https://s3.example.com/bucket/${key}`,
}))

const baseProps = {
  title: 'Тест заголовок',
  slug: 'test-slug',
  coverImageKey: null,
  publishedAt: new Date('2026-01-15'),
  categories: [{ id: '1', name: 'Фото', slug: 'photo' }],
}

describe('MediaCard', () => {
  it('рендерит заголовок', () => {
    render(<MediaCard {...baseProps} />)
    expect(screen.getByText('Тест заголовок')).toBeInTheDocument()
  })
  it('рендерит категорию', () => {
    render(<MediaCard {...baseProps} />)
    expect(screen.getByText('Фото')).toBeInTheDocument()
  })
  it('ссылка ведёт на /post/[slug]', () => {
    render(<MediaCard {...baseProps} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/post/test-slug')
  })
  it('без обложки нет img', () => {
    render(<MediaCard {...baseProps} coverImageKey={null} />)
    expect(screen.queryByRole('img')).toBeNull()
  })
})
```

- [ ] **Шаг 2: Запустить — убедиться что падает**

```bash
npm test -- MediaCard
```

- [ ] **Шаг 3: Реализовать `src/shared/ui/MediaCard.tsx`**

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { getPostUrl } from '@/shared/lib/getPostUrl'
import { Tag } from './Tag'
import { cn } from '@/shared/lib/cn'

interface MediaCardProps {
  title: string
  slug: string
  coverImageKey?: string | null
  publishedAt: Date | null
  categories: { id: string; name: string; slug: string }[]
  className?: string
}

export function MediaCard({ title, slug, coverImageKey, publishedAt, categories, className }: MediaCardProps) {
  const date = publishedAt
    ? new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(publishedAt))
    : null

  return (
    <Link href={`/post/${slug}`}
      className={cn(
        'group block relative overflow-hidden rounded-[2px]',
        'border border-hairline bg-glass',
        'transition-transform duration-200 ease-out',
        'hover:-translate-y-[3px] hover:bg-[rgba(255,255,255,0.06)]',
        'active:scale-[0.98]',
        className
      )}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-glass">
        {coverImageKey ? (
          <Image src={getPostUrl(coverImageKey)} alt={title} fill className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,59,48,0.15)] to-transparent" />
        )}
      </div>
      <div className="p-[18px] flex flex-col gap-2">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => <Tag key={cat.id}>{cat.name}</Tag>)}
          </div>
        )}
        <h3 className="font-display font-bold text-text text-lg leading-tight lowercase tracking-tight">{title}</h3>
        {date && <p className="font-body text-[13px] text-caption">{date}</p>}
      </div>
    </Link>
  )
}
```

- [ ] **Шаг 4: Запустить — убедиться что проходит**

```bash
npm test -- MediaCard
```
Ожидание: 4 tests passed

- [ ] **Шаг 5: Коммит**

```bash
git add src/shared/ui/MediaCard.tsx src/shared/ui/__tests__/
git commit -m "feat: MediaCard component with hover effects"
```

---

## Task 9: Header, Footer, BottomNav

**Files:**
- Create: `src/shared/ui/Header.tsx`
- Create: `src/shared/ui/Footer.tsx`
- Create: `src/shared/ui/BottomNav.tsx`
- Create: `src/shared/ui/index.ts`

**Interfaces:**
- Consumes: `Logo`, `NavLine`, `ThemeToggle`
- Note: Header получает `categories` как prop (данные фетчатся в layout.tsx)

- [ ] **Шаг 1: Создать `src/shared/ui/Footer.tsx`**

```tsx
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="bg-footer border-t border-hairline py-8 px-5 md:px-12">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Logo size={28} />
        <p className="font-nav uppercase tracking-widest text-[10px] text-caption">
          powered by PHL·ART © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
```

- [ ] **Шаг 2: Создать `src/shared/ui/BottomNav.tsx`**

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/cn'

interface BottomNavProps {
  categories: { id: string; name: string; slug: string }[]
}

export function BottomNav({ categories }: BottomNavProps) {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-footer border-t border-hairline z-40">
      <ul className="flex items-center justify-around py-2">
        <li>
          <Link href="/" className={cn('flex flex-col items-center gap-0.5 px-3 py-2 min-h-[44px] min-w-[44px] font-nav uppercase tracking-widest text-[9px]', pathname === '/' ? 'text-accent' : 'text-caption')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            Главная
          </Link>
        </li>
        {categories.slice(0, 3).map(cat => (
          <li key={cat.id}>
            <Link href={`/${cat.slug}`} className={cn('flex flex-col items-center gap-0.5 px-3 py-2 min-h-[44px] min-w-[44px] font-nav uppercase tracking-widest text-[9px]', pathname.startsWith(`/${cat.slug}`) ? 'text-accent' : 'text-caption')}>
              <span className="w-5 h-5" aria-hidden />
              {cat.name}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/search" className={cn('flex flex-col items-center gap-0.5 px-3 py-2 min-h-[44px] min-w-[44px] font-nav uppercase tracking-widest text-[9px]', pathname === '/search' ? 'text-accent' : 'text-caption')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Поиск
          </Link>
        </li>
      </ul>
    </nav>
  )
}
```

- [ ] **Шаг 3: Создать `src/shared/ui/Header.tsx`**

```tsx
import { Logo } from './Logo'
import { NavLine } from './NavLine'
import { ThemeToggle } from './ThemeToggle'
import Link from 'next/link'

interface HeaderProps {
  categories: { id: string; name: string; slug: string }[]
}

export function Header({ categories }: HeaderProps) {
  const navItems = [
    { label: 'Главная', href: '/' },
    ...categories.map(c => ({ label: c.name, href: `/${c.slug}` })),
  ]
  return (
    <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-hairline">
      <div className="max-w-7xl mx-auto px-5 md:px-12 h-16 flex items-center justify-between gap-6">
        <Logo variant="white" size={32} />
        <div className="hidden md:flex flex-1">
          <NavLine items={navItems} />
        </div>
        <div className="flex items-center">
          <Link href="/search" aria-label="Поиск" className="w-11 h-11 flex items-center justify-center text-caption hover:text-text transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Шаг 4: Создать `src/shared/ui/index.ts`**

```ts
export { Logo } from './Logo'
export { GradientSurface } from './GradientSurface'
export { SectionTitle } from './SectionTitle'
export { NavLine } from './NavLine'
export { Tag } from './Tag'
export { Rating } from './Rating'
export { ThemeToggle } from './ThemeToggle'
export { ReadingProgress } from './ReadingProgress'
export { MediaCard } from './MediaCard'
export { SocialLinks } from './SocialLinks'
export { Header } from './Header'
export { Footer } from './Footer'
export { BottomNav } from './BottomNav'
```

- [ ] **Шаг 5: TypeScript check + коммит**

```bash
npx tsc --noEmit
git add src/shared/ui/
git commit -m "feat: layout components — Header, Footer, BottomNav"
```

---

## Task 10: BlockRenderer

**Files:**
- Create: `src/entities/post/ui/BlockRenderer/index.tsx` + все 7 блок-компонентов
- Create: `src/entities/post/ui/__tests__/BlockRenderer.test.tsx`

**Interfaces:**
- Consumes: `Block` из `@/entities/post/types`, `getPostUrl`
- Produces: `BlockRenderer({ blocks: Block[] })`

- [ ] **Шаг 1: Написать тест**

```tsx
// src/entities/post/ui/__tests__/BlockRenderer.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BlockRenderer } from '../BlockRenderer'
import type { Block } from '@/entities/post/types'

vi.mock('@/shared/lib/getPostUrl', () => ({
  getPostUrl: (key: string) => `https://cdn.example.com/${key}`,
}))

describe('BlockRenderer', () => {
  it('рендерит text блок', () => {
    render(<BlockRenderer blocks={[{ type: 'text', html: '<p>Привет мир</p>' }]} />)
    expect(screen.getByText('Привет мир')).toBeInTheDocument()
  })
  it('рендерит quote с автором', () => {
    render(<BlockRenderer blocks={[{ type: 'quote', text: 'Цитата', author: 'Автор' }]} />)
    expect(screen.getByText('Цитата')).toBeInTheDocument()
    expect(screen.getByText('Автор')).toBeInTheDocument()
  })
  it('рендерит heading h2', () => {
    render(<BlockRenderer blocks={[{ type: 'heading', level: 2, text: 'Заголовок' }]} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Заголовок' })).toBeInTheDocument()
  })
  it('рендерит photo с img', () => {
    render(<BlockRenderer blocks={[{ type: 'photo', s3Key: 'photos/test.jpg', caption: 'Подпись' }]} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
    expect(screen.getByText('Подпись')).toBeInTheDocument()
  })
  it('не падает на пустом массиве', () => {
    render(<BlockRenderer blocks={[]} />)
  })
})
```

- [ ] **Шаг 2: Запустить — убедиться что падает**

```bash
npm test -- BlockRenderer
```

- [ ] **Шаг 3: Создать блок-компоненты**

`TextBlock.tsx`:
```tsx
import DOMPurify from 'dompurify'
export function TextBlock({ html }: { html: string }) {
  const clean = typeof window !== 'undefined' ? DOMPurify.sanitize(html) : html
  return <div className="font-body font-light text-body leading-[1.72] text-[17px]" dangerouslySetInnerHTML={{ __html: clean }} />
}
```

`PhotoBlock.tsx`:
```tsx
import Image from 'next/image'
import { getPostUrl } from '@/shared/lib/getPostUrl'
export function PhotoBlock({ s3Key, caption }: { s3Key: string; caption?: string }) {
  return (
    <figure>
      <div className="relative w-full aspect-[3/2] rounded-[2px] overflow-hidden">
        <Image src={getPostUrl(s3Key)} alt={caption ?? ''} fill className="object-cover" sizes="(max-width: 768px) 100vw, 860px" />
      </div>
      {caption && <figcaption className="mt-2 font-body text-[13px] text-caption text-center">{caption}</figcaption>}
    </figure>
  )
}
```

`PhotoGridBlock.tsx`:
```tsx
import Image from 'next/image'
import { getPostUrl } from '@/shared/lib/getPostUrl'
export function PhotoGridBlock({ columns, photos }: { columns: 2 | 3; photos: { s3Key: string; caption?: string }[] }) {
  return (
    <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {photos.map((photo, i) => (
        <figure key={i}>
          <div className="relative w-full aspect-[2/3] rounded-[2px] overflow-hidden">
            <Image src={getPostUrl(photo.s3Key)} alt={photo.caption ?? ''} fill className="object-cover" sizes="33vw" />
          </div>
          {photo.caption && <figcaption className="mt-1 font-body text-[11px] text-caption text-center">{photo.caption}</figcaption>}
        </figure>
      ))}
    </div>
  )
}
```

`PanoramaBlock.tsx`:
```tsx
import Image from 'next/image'
import { getPostUrl } from '@/shared/lib/getPostUrl'
export function PanoramaBlock({ s3Key, caption }: { s3Key: string; caption?: string }) {
  return (
    <figure className="-mx-5 md:-mx-12">
      <div className="relative w-full aspect-[21/9] overflow-hidden">
        <Image src={getPostUrl(s3Key)} alt={caption ?? ''} fill className="object-cover" sizes="100vw" />
      </div>
      {caption && <figcaption className="mt-2 px-5 md:px-12 font-body text-[13px] text-caption text-center">{caption}</figcaption>}
    </figure>
  )
}
```

`EmbedBlock.tsx`:
```tsx
export function EmbedBlock({ html }: { html: string }) {
  return <div className="w-full overflow-hidden rounded-[4px]" dangerouslySetInnerHTML={{ __html: html }} />
}
```

`QuoteBlock.tsx`:
```tsx
export function QuoteBlock({ text, author }: { text: string; author?: string }) {
  return (
    <blockquote className="pl-5 border-l-[4px] border-accent my-6">
      <p className="font-editorial italic text-body text-[19px] leading-[1.6]">{text}</p>
      {author && <cite className="block mt-2 font-body text-[13px] text-caption not-italic">— {author}</cite>}
    </blockquote>
  )
}
```

`HeadingBlock.tsx`:
```tsx
import { cn } from '@/shared/lib/cn'
export function HeadingBlock({ level, text }: { level: 2 | 3; text: string }) {
  const Tag = `h${level}` as 'h2' | 'h3'
  return <Tag className={cn('font-display font-bold text-text lowercase tracking-tight', level === 2 ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl')}>{text}</Tag>
}
```

- [ ] **Шаг 4: Создать `index.tsx`**

```tsx
import type { Block } from '@/entities/post/types'
import { TextBlock } from './TextBlock'
import { PhotoBlock } from './PhotoBlock'
import { PhotoGridBlock } from './PhotoGridBlock'
import { PanoramaBlock } from './PanoramaBlock'
import { EmbedBlock } from './EmbedBlock'
import { QuoteBlock } from './QuoteBlock'
import { HeadingBlock } from './HeadingBlock'

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'text':      return <TextBlock      key={i} {...block} />
          case 'photo':     return <PhotoBlock     key={i} {...block} />
          case 'photoGrid': return <PhotoGridBlock key={i} {...block} />
          case 'panorama':  return <PanoramaBlock  key={i} {...block} />
          case 'embed':     return <EmbedBlock     key={i} {...block} />
          case 'quote':     return <QuoteBlock     key={i} {...block} />
          case 'heading':   return <HeadingBlock   key={i} {...block} />
        }
      })}
    </div>
  )
}
```

- [ ] **Шаг 5: Запустить — убедиться что проходит**

```bash
npm test -- BlockRenderer
```
Ожидание: 5 tests passed

- [ ] **Шаг 6: Коммит**

```bash
git add src/entities/post/ui/
git commit -m "feat: BlockRenderer with all 7 block types"
```

---

## Task 11: Entity Queries

**Files:**
- Create: `src/entities/post/queries.ts`
- Create: `src/entities/category/queries.ts`
- Create: `src/shared/lib/search.ts`

**Interfaces:**
- Produces:
  - `getFeaturedPost(): Promise<PostPreview | null>`
  - `getRecentPosts(limit: number): Promise<PostPreview[]>`
  - `getPostBySlug(slug: string): Promise<PostFull | null>`
  - `getPostsByCategory(slug: string, opts): Promise<{ posts: PostPreview[]; total: number }>`
  - `getPublicCategories(): Promise<Category[]>`
  - `getCategoryBySlug(slug: string): Promise<Category | null>`
  - `getCategoryHeroBg(category: Category): Promise<CategoryHeroBg>`
  - `searchPosts(query: string): Promise<PostPreview[]>`

- [ ] **Шаг 1: Создать `src/entities/post/queries.ts`**

```ts
import { prisma } from '@/shared/lib/prisma'
import type { PostPreview, PostFull, Block } from './types'

const categorySelect = { id: true, name: true, slug: true } as const
const postPreviewSelect = {
  id: true, title: true, slug: true, coverImageKey: true,
  publishedAt: true, isFeatured: true,
  categories: { select: categorySelect },
} as const

export async function getFeaturedPost(): Promise<PostPreview | null> {
  return prisma.post.findFirst({ where: { status: 'PUBLISHED', isFeatured: true }, select: postPreviewSelect })
}

export async function getRecentPosts(limit: number): Promise<PostPreview[]> {
  return prisma.post.findMany({ where: { status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, take: limit, select: postPreviewSelect })
}

export async function getPostBySlug(slug: string): Promise<PostFull | null> {
  const post = await prisma.post.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      categories: { select: categorySelect },
      tags: { select: { id: true, name: true, slug: true } },
      socialLinks: { include: { social: { select: { id: true, name: true, iconUrl: true } } }, orderBy: { createdAt: 'asc' } },
    },
  })
  if (!post) return null
  return { ...post, body: post.body as Block[] } as PostFull
}

export async function getPostsByCategory(
  categorySlug: string,
  { page, limit }: { page: number; limit: number }
): Promise<{ posts: PostPreview[]; total: number }> {
  const where = { status: 'PUBLISHED' as const, categories: { some: { slug: categorySlug } } }
  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({ where, orderBy: { publishedAt: 'desc' }, skip: (page - 1) * limit, take: limit, select: postPreviewSelect }),
    prisma.post.count({ where }),
  ])
  return { posts, total }
}
```

- [ ] **Шаг 2: Создать `src/entities/category/queries.ts`**

```ts
import { prisma } from '@/shared/lib/prisma'
import type { Category, CategoryHeroBg } from './types'

export async function getPublicCategories(): Promise<Category[]> {
  return prisma.category.findMany({ orderBy: { order: 'asc' } })
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return prisma.category.findUnique({ where: { slug } })
}

export async function getCategoryHeroBg(category: Category): Promise<CategoryHeroBg> {
  const post = await prisma.post.findFirst({
    where: { status: 'PUBLISHED', categories: { some: { id: category.id } } },
    orderBy: { publishedAt: 'desc' },
    select: { body: true },
  })
  if (post) {
    const blocks = post.body as { type: string; s3Key?: string; photos?: { s3Key: string }[] }[]
    const photoBlock = blocks.find(b => b.type === 'photo' || b.type === 'panorama')
    const gridBlock = blocks.find(b => b.type === 'photoGrid')
    if (photoBlock?.s3Key) return { type: 'image', s3Key: photoBlock.s3Key }
    if (gridBlock?.photos?.[0]?.s3Key) return { type: 'image', s3Key: gridBlock.photos[0].s3Key }
  }
  if (category.gradientCss) return { type: 'gradient', css: category.gradientCss }
  return { type: 'default' }
}
```

- [ ] **Шаг 3: Создать `src/shared/lib/search.ts`**

```ts
import { prisma } from './prisma'
import type { PostPreview } from '@/entities/post/types'

export async function searchPosts(query: string): Promise<PostPreview[]> {
  if (!query.trim()) return []
  return prisma.post.findMany({
    where: { status: 'PUBLISHED', title: { contains: query, mode: 'insensitive' } },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: { id: true, title: true, slug: true, coverImageKey: true, publishedAt: true, isFeatured: true, categories: { select: { id: true, name: true, slug: true } } },
  })
}
```

- [ ] **Шаг 4: TypeScript check + коммит**

```bash
npx tsc --noEmit
git add src/entities/ src/shared/lib/search.ts
git commit -m "feat: entity queries for posts, categories and search"
```

---

## Task 12: App Layouts + Admin Stub

**Files:**
- Create: `src/app/(public)/layout.tsx`
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/app/(admin)/login/page.tsx`

- [ ] **Шаг 1: Создать `src/app/(public)/layout.tsx`**

```tsx
import { Header } from '@/shared/ui/Header'
import { Footer } from '@/shared/ui/Footer'
import { BottomNav } from '@/shared/ui/BottomNav'
import { getPublicCategories } from '@/entities/category/queries'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const categories = await getPublicCategories()
  return (
    <>
      <Header categories={categories} />
      <main className="min-h-screen pb-20 md:pb-0">{children}</main>
      <Footer />
      <BottomNav categories={categories} />
    </>
  )
}
```

- [ ] **Шаг 2: Создать `src/app/(admin)/layout.tsx`**

```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bg text-text">{children}</div>
}
```

- [ ] **Шаг 3: Создать `src/app/(admin)/login/page.tsx`**

```tsx
export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="font-display font-bold text-text text-2xl lowercase">Студия публикаций</p>
        <p className="mt-2 font-body text-caption text-sm">Авторизация появится в Phase 2</p>
      </div>
    </div>
  )
}
```

- [ ] **Шаг 4: Проверить + коммит**

```bash
npm run dev
# http://localhost:3000 и http://localhost:3000/admin/login открываются
git add src/app/
git commit -m "feat: public layout with header/footer, admin stub"
```

---

## Task 13: Главная страница

> **Дизайн-рефы (локальные, не в git):** прочитать **перед реализацией**:
> - `docs/refs/README.md` — раздел «01 — Главная»
> - `docs/refs/designs/Главная.dc.html` — макет десктоп
> - `docs/refs/designs/Главная - мобильная.dc.html` — макет мобайл (390px)
> - `docs/refs/screenshots/01-главная.png` и `docs/refs/screenshots/02-главная-мобильная.png`
>
> Реализация воспроизводит макет пиксель-в-пиксель. Стили брать из инлайн `style="..."` в `.dc.html`.

**Files:**
- Create: `src/app/(public)/page.tsx`

- [ ] **Шаг 1: Создать `src/app/(public)/page.tsx`**

```tsx
import Image from 'next/image'
import Link from 'next/link'
import { getFeaturedPost, getRecentPosts } from '@/entities/post/queries'
import { MediaCard, SectionTitle, GradientSurface } from '@/shared/ui'
import { getPostUrl } from '@/shared/lib/getPostUrl'

export const revalidate = 60

export default async function HomePage() {
  const [featured, recent] = await Promise.all([getFeaturedPost(), getRecentPosts(12)])

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-12 py-10 md:py-16">
      {featured && (
        <section className="mb-16 md:mb-20">
          <Link href={`/post/${featured.slug}`} className="group block">
            <GradientSurface className="relative rounded-[2px] overflow-hidden min-h-[420px] md:min-h-[560px]">
              {featured.coverImageKey && (
                <Image src={getPostUrl(featured.coverImageKey)} alt={featured.title} fill priority
                  className="object-cover opacity-70 group-hover:opacity-80 transition-opacity duration-300" sizes="100vw" />
              )}
              <div className="relative z-10 p-8 md:p-12 flex flex-col justify-end h-full min-h-[420px] md:min-h-[560px] bg-gradient-to-t from-[rgba(0,0,0,0.7)] via-transparent to-transparent">
                {featured.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {featured.categories.map(cat => (
                      <span key={cat.id} className="font-nav uppercase tracking-widest text-[10px] text-white/60">{cat.name}</span>
                    ))}
                  </div>
                )}
                <h1 className="font-display font-bold text-white text-3xl md:text-5xl lowercase tracking-tight leading-tight max-w-2xl">{featured.title}</h1>
                {featured.publishedAt && (
                  <p className="mt-3 font-body text-sm text-white/50">
                    {new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(featured.publishedAt))}
                  </p>
                )}
              </div>
            </GradientSurface>
          </Link>
        </section>
      )}
      {recent.length > 0 && (
        <section>
          <SectionTitle className="mb-8">последние материалы</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recent.map(post => (
              <MediaCard key={post.id} title={post.title} slug={post.slug}
                coverImageKey={post.coverImageKey} publishedAt={post.publishedAt} categories={post.categories} />
            ))}
          </div>
        </section>
      )}
      {!featured && recent.length === 0 && (
        <div className="text-center py-32">
          <p className="font-body text-caption">Публикации появятся здесь</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Шаг 2: Проверить в браузере** — `http://localhost:3000`, сверить со скриншотами

- [ ] **Шаг 3: Коммит**

```bash
git add src/app/(public)/page.tsx
git commit -m "feat: homepage with featured hero and posts grid"
```

---

## Task 14: Страница категории

> **Дизайн-рефы (локальные, не в git):**
> - `docs/refs/README.md` — раздел «02 — Раздел «Фото»»
> - `docs/refs/designs/Раздел Фото.dc.html` — десктоп
> - `docs/refs/designs/Раздел Фото - мобильная.dc.html` — мобайл
> - `docs/refs/screenshots/03-раздел-фото.png` и `docs/refs/screenshots/04-раздел-фото-мобильная.png`
>
> Этот макет — пример для **всех** категорий, не только «Фото».

**Files:**
- Create: `src/app/(public)/[categorySlug]/page.tsx`

- [ ] **Шаг 1: Создать `src/app/(public)/[categorySlug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCategoryBySlug, getCategoryHeroBg } from '@/entities/category/queries'
import { getPostsByCategory } from '@/entities/post/queries'
import { MediaCard, SectionTitle } from '@/shared/ui'
import { getPostUrl } from '@/shared/lib/getPostUrl'

export const revalidate = 60

interface Props {
  params: { categorySlug: string }
  searchParams: { page?: string }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page ?? 1))
  const limit = 12
  const category = await getCategoryBySlug(params.categorySlug)
  if (!category) notFound()

  const [{ posts, total }, heroBg] = await Promise.all([
    getPostsByCategory(params.categorySlug, { page, limit }),
    getCategoryHeroBg(category),
  ])
  const totalPages = Math.ceil(total / limit)

  const heroBgStyle =
    heroBg.type === 'gradient' ? { background: heroBg.css } :
    heroBg.type === 'default' ? { background: 'linear-gradient(135deg, #1a1416 0%, #2d1b1e 100%)' } : undefined

  return (
    <div>
      <section className="relative h-48 md:h-72 overflow-hidden" style={heroBgStyle}>
        {heroBg.type === 'image' && (
          <Image src={getPostUrl(heroBg.s3Key)} alt={category.name} fill className="object-cover opacity-50" priority sizes="100vw" />
        )}
        <div className="relative z-10 h-full flex items-end px-5 md:px-12 pb-8 bg-gradient-to-t from-bg/80 to-transparent">
          <h1 className="font-display font-bold text-text text-3xl md:text-5xl lowercase tracking-tight">{category.name}</h1>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-5 md:px-12 py-10 md:py-14">
        {category.description && <p className="font-body text-body text-[17px] mb-10 max-w-2xl">{category.description}</p>}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map(post => (
              <MediaCard key={post.id} title={post.title} slug={post.slug}
                coverImageKey={post.coverImageKey} publishedAt={post.publishedAt} categories={post.categories} />
            ))}
          </div>
        ) : (
          <p className="font-body text-caption text-center py-20">В этом разделе пока нет материалов</p>
        )}
        {totalPages > 1 && (
          <nav className="flex justify-center gap-2 mt-12" aria-label="Страницы">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link key={p} href={`/${params.categorySlug}?page=${p}`}
                className={`w-11 h-11 flex items-center justify-center rounded-[2px] border font-nav text-[11px] uppercase tracking-widest transition-colors ${p === page ? 'border-accent text-accent' : 'border-hairline text-caption hover:text-text hover:border-text/30'}`}
                aria-current={p === page ? 'page' : undefined}>{p}</Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Шаг 2: Проверить** — `/photo` (или любой slug категории из БД), несуществующий slug → 404

- [ ] **Шаг 3: Коммит**

```bash
git add src/app/(public)/[categorySlug]/
git commit -m "feat: category page with hero image and paginated posts"
```

---

## Task 15: Страница поста

> **Дизайн-рефы (локальные, не в git):**
> - `docs/refs/README.md` — раздел «03 — Страница материала»
> - `docs/refs/designs/Страница материала.dc.html` — десктоп
> - `docs/refs/designs/Страница материала - мобильная.dc.html` — мобайл
> - `docs/refs/screenshots/05-страница-материала.png` и `docs/refs/screenshots/06-страница-материала-мобильная.png`
>
> Обратить особое внимание: hero с обложкой + градиент-затемнение, красная полоса прогресса, цитата Lora italic с красной левой границей.

**Files:**
- Create: `src/app/(public)/post/[postSlug]/page.tsx`

- [ ] **Шаг 1: Создать `src/app/(public)/post/[postSlug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { getPostBySlug } from '@/entities/post/queries'
import { BlockRenderer } from '@/entities/post/ui/BlockRenderer'
import { ReadingProgress, SocialLinks, Tag } from '@/shared/ui'
import { getPostUrl } from '@/shared/lib/getPostUrl'

export const revalidate = 300

interface Props { params: { postSlug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.postSlug)
  if (!post) return {}
  return {
    title: `${post.title} — PHL·ART`,
    openGraph: { title: post.title, images: post.coverImageKey ? [getPostUrl(post.coverImageKey)] : [] },
  }
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug(params.postSlug)
  if (!post) notFound()

  const date = post.publishedAt
    ? new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(post.publishedAt))
    : null

  return (
    <>
      <ReadingProgress />
      <article className="max-w-3xl mx-auto px-5 md:px-12 py-10 md:py-16">
        {post.coverImageKey && (
          <div className="relative -mx-5 md:-mx-12 mb-10 aspect-[16/9] overflow-hidden">
            <Image src={getPostUrl(post.coverImageKey)} alt={post.title} fill priority className="object-cover"
              sizes="(max-width: 1024px) 100vw, 900px" />
          </div>
        )}
        <header className="mb-10">
          {post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map(cat => <Tag key={cat.id} href={`/${cat.slug}`}>{cat.name}</Tag>)}
            </div>
          )}
          <h1 className="font-display font-bold text-text text-3xl md:text-[42px] lowercase tracking-tight leading-tight mb-4">{post.title}</h1>
          <div className="flex flex-wrap gap-4 items-center">
            {date && <time className="font-body text-sm text-caption">{date}</time>}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map(tag => <Tag key={tag.id} href={`/search?q=${encodeURIComponent(tag.name)}`}>{tag.name}</Tag>)}
              </div>
            )}
          </div>
        </header>
        <BlockRenderer blocks={post.body} />
        <SocialLinks links={post.socialLinks} />
      </article>
    </>
  )
}
```

- [ ] **Шаг 2: Проверить** — страница поста открывается, полоса прогресса работает

- [ ] **Шаг 3: Коммит**

```bash
git add src/app/(public)/post/
git commit -m "feat: post page with BlockRenderer, reading progress, social links"
```

---

## Task 16: Поиск

> **Дизайн-рефы (локальные, не в git):**
> - `docs/refs/README.md` — раздел «04 — Результаты поиска»
> - `docs/refs/designs/Результаты поиска.dc.html` — десктоп (мобильной нет)
> - `docs/refs/screenshots/07-результаты-поиска.png`

**Files:**
- Create: `src/app/(public)/search/page.tsx`
- Create: `src/app/api/search/route.ts`

- [ ] **Шаг 1: Создать `src/app/api/search/route.ts`**

```ts
import { NextRequest } from 'next/server'
import { searchPosts } from '@/shared/lib/search'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const posts = await searchPosts(q)
  return Response.json({ posts })
}
```

- [ ] **Шаг 2: Создать `src/app/(public)/search/page.tsx`**

```tsx
import { SectionTitle, MediaCard } from '@/shared/ui'
import { searchPosts } from '@/shared/lib/search'

interface Props { searchParams: { q?: string } }

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q?.trim() ?? ''
  const results = query ? await searchPosts(query) : []

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-12 py-10 md:py-16">
      <form method="GET" className="mb-10">
        <div className="relative max-w-xl">
          <input name="q" defaultValue={query} placeholder="Поиск по материалам..." autoFocus
            className="w-full bg-glass border border-hairline rounded-[4px] px-4 py-3 font-body text-text placeholder:text-caption focus:outline-none focus:border-accent text-[17px]" />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-caption hover:text-text transition-colors" aria-label="Найти">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
        </div>
      </form>
      {query && (
        <>
          <SectionTitle className="mb-2">{results.length > 0 ? `Найдено: ${results.length}` : 'Ничего не найдено'}</SectionTitle>
          {results.length > 0 && <p className="font-body text-caption text-sm mb-8">по запросу «{query}»</p>}
          {results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map(post => (
                <MediaCard key={post.id} title={post.title} slug={post.slug}
                  coverImageKey={post.coverImageKey} publishedAt={post.publishedAt} categories={post.categories} />
              ))}
            </div>
          )}
        </>
      )}
      {!query && <p className="font-body text-caption text-center py-20">Введи запрос для поиска</p>}
    </div>
  )
}
```

- [ ] **Шаг 3: Проверить + коммит**

```bash
npm run dev
# /search и /api/search?q=тест работают
git add src/app/(public)/search/ src/app/api/search/
git commit -m "feat: search page and /api/search endpoint"
```

---

## Task 17: API Routes — Health + Revalidate

**Files:**
- Create: `src/app/api/health/route.ts`
- Create: `src/app/api/revalidate/route.ts`

- [ ] **Шаг 1: Создать `src/app/api/health/route.ts`**

```ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

- [ ] **Шаг 2: Создать `src/app/api/revalidate/route.ts`**

```ts
import { revalidatePath } from 'next/cache'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || token !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let paths: string[]
  try {
    const body = await req.json()
    paths = body.paths
    if (!Array.isArray(paths)) throw new Error()
  } catch {
    return Response.json({ error: 'Invalid body. Expected { paths: string[] }' }, { status: 400 })
  }
  for (const path of paths) revalidatePath(path)
  return Response.json({ revalidated: true, paths })
}
```

- [ ] **Шаг 3: Проверить**

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"..."}

curl -X POST http://localhost:3000/api/revalidate \
  -H "Authorization: Bearer wrong" -H "Content-Type: application/json" \
  -d '{"paths":["/"]}'
# {"error":"Unauthorized"} 401
```

- [ ] **Шаг 4: Коммит**

```bash
git add src/app/api/
git commit -m "feat: /api/health and /api/revalidate endpoints"
```

---

## Task 18: Deployment Files

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `scripts/setup-s3-cors.sh`

- [ ] **Шаг 1: Создать `Dockerfile`**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

- [ ] **Шаг 2: Создать `docker-compose.yml`**

```yaml
version: '3.8'

services:
  web:
    build: .
    restart: unless-stopped
    env_file: .env
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.phlart.rule=Host(`art.ph1l74.com`)"
      - "traefik.http.routers.phlart.entrypoints=websecure"
      - "traefik.http.routers.phlart.tls.certresolver=letsencrypt"
      - "traefik.http.services.phlart.loadbalancer.server.port=3000"

networks:
  default:
    external: true
    name: traefik
```

- [ ] **Шаг 3: Создать `scripts/setup-s3-cors.sh`**

```bash
#!/usr/bin/env bash
# Применяет CORS на S3-бакет firstvds.ru (с workaround на самоподписанный сертификат).
# Использование:
#   export S3_ENDPOINT=s3.firstvds.ru S3_BUCKET=phlart S3_REGION=default
#   export S3_ACCESS_KEY=... S3_SECRET_KEY=...
#   export CORS_JSON='{...}'
#   bash scripts/setup-s3-cors.sh

set -euo pipefail

HOSTNAME="${S3_ENDPOINT}"
CERT_FILE=$(mktemp /tmp/firstvds-ca.XXXXXX.pem)
trap 'rm -f "$CERT_FILE"' EXIT

echo "→ Получаем TLS-сертификат с ${HOSTNAME}..."
openssl s_client -connect "${HOSTNAME}:443" -showcerts </dev/null 2>/dev/null \
  | openssl x509 -outform PEM > "$CERT_FILE"

export AWS_CA_BUNDLE="$CERT_FILE"
export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY}"
export AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY}"
export AWS_DEFAULT_REGION="${S3_REGION}"
ENDPOINT_URL="https://${S3_ENDPOINT}"

echo "→ Применяем CORS на бакет ${S3_BUCKET}..."
aws s3api put-bucket-cors --endpoint-url "${ENDPOINT_URL}" --bucket "${S3_BUCKET}" --cors-configuration "${CORS_JSON}"

echo "→ Проверяем:"
aws s3api get-bucket-cors --endpoint-url "${ENDPOINT_URL}" --bucket "${S3_BUCKET}"
echo "✓ CORS настроен."
```

```bash
chmod +x scripts/setup-s3-cors.sh
```

- [ ] **Шаг 4: Проверить production сборку**

```bash
npm run build
```

- [ ] **Шаг 5: Финальный коммит**

```bash
git add Dockerfile docker-compose.yml scripts/
git commit -m "feat: Dockerfile, docker-compose for Traefik, S3 CORS setup script"
```

---

## Checklist перед деплоем

- [ ] `npm run build` без ошибок
- [ ] `npm test` — все зелёные
- [ ] `npx tsc --noEmit` — нет ошибок TypeScript
- [ ] `/` — главная рендерится
- [ ] `/[slug]` — категория или 404
- [ ] `/post/[slug]` — пост или 404
- [ ] `/search?q=тест` — поиск работает
- [ ] `/api/health` → `{"status":"ok"}`
- [ ] `/api/revalidate` без токена → 401
- [ ] Тёмная/светлая тема переключается без flash
- [ ] Мобайл (390px): гамбургер, bottom nav видны
