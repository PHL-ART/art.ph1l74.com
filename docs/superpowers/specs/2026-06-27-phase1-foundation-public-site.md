# Spec: Phase 1 — Foundation + Public Site

**Date:** 2026-06-27
**Project:** PHL·ART
**Status:** Approved

---

## Scope

Phase 1 реализует полностью рабочий публичный сайт, который можно задеплоить и показать. Студия публикаций, кросс-постинг и Telegram-миграция — отдельные фазы.

**Включает:**
- Next.js проект с дизайн-системой и токенами
- Схема БД + Prisma migrations
- 4 публичных страницы (Главная, Раздел, Пост, Поиск) — адаптивные, тёмная/светлая тема
- Healthcheck endpoint
- Docker Compose для деплоя на `art.ph1l74.com`

**Не включает:** студию, авторизацию, S3 upload, кросс-постинг.

---

## Architecture

### Структура проекта (FSD-lite)

```
src/
  app/
    (public)/
      layout.tsx           # Header + Footer + ThemeProvider
      page.tsx             # / — главная
      [categorySlug]/
        page.tsx           # /photo, /kino, ...
      post/
        [postSlug]/
          page.tsx         # /post/my-essay
      search/
        page.tsx           # /search?q=
    (admin)/
      layout.tsx           # заглушка, Phase 2
      login/page.tsx       # /admin/login — заглушка
    api/
      health/route.ts      # GET /api/health
      search/route.ts      # GET /api/search?q=
      revalidate/route.ts  # POST /api/revalidate
  entities/
    post/
      types.ts             # Post, Block типы
      queries.ts           # Prisma-запросы
      ui/
        BlockRenderer.tsx
        SocialLinks.tsx
    category/
      types.ts
      queries.ts
    tag/
      types.ts
  shared/
    ui/                    # дизайн-система
      Logo.tsx
      GradientSurface.tsx
      MediaCard.tsx
      SectionTitle.tsx
      NavLine.tsx
      Tag.tsx
      Rating.tsx
      ThemeToggle.tsx
      Header.tsx
      Footer.tsx
      BottomNav.tsx
      ReadingProgress.tsx
      SocialLinks.tsx
    lib/
      prisma.ts            # Prisma singleton
    config/
      theme.ts             # маппинг токенов → Tailwind
  styles/
    globals.css            # CSS-переменные тёмной/светлой темы
```

### Рендеринг

| Страница | Стратегия | Revalidate |
|---|---|---|
| `/` | ISR | 60s |
| `/[categorySlug]` | ISR | 60s |
| `/post/[postSlug]` | ISR | 300s |
| `/search` | Dynamic (no cache) | — |
| `/api/health` | Dynamic | — |

On-demand revalidation: при публикации поста из студии (Phase 2) вызывается `POST /api/revalidate` с `REVALIDATE_SECRET`, который сбрасывает кэш нужных путей. ISR — страховой fallback.

---

## Data Model (Prisma)

```prisma
enum PostStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
}

model Post {
  id            String      @id @default(cuid())
  title         String
  slug          String      @unique   // авто-генерируется из title при создании/изменении названия,
                                      // может быть переопределён вручную в студии
  body          Json        // Block[] — массив контент-блоков
  coverImageKey String?     // S3 key обложки (path-style: s3Key → full URL при рендере)
  isFeatured    Boolean     @default(false)  // только один пост может быть featured
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
  slug        String   @unique   // codename для URL: "photo", "kino", "blog"
  description String?
  gradientCss String?  // CSS-строка fallback-фона
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
  slug      String       @unique     // стабильный программный ID — НЕ редактируется после создания
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

### isFeatured — логика

При установке `isFeatured = true` на посте выполняется атомарная транзакция:
```ts
await prisma.$transaction([
  prisma.post.updateMany({ where: { isFeatured: true }, data: { isFeatured: false } }),
  prisma.post.update({ where: { id }, data: { isFeatured: true } }),
])
```
В любой момент в БД ровно один пост с `isFeatured = true`.

### Post.slug — логика

- При создании/изменении `title` — автоматически транслитерируется в slug (ru → latin kebab-case).
- Пользователь может переопределить slug вручную в студии.
- Slug должен быть уникальным; при коллизии — добавляется числовой суффикс (`-2`, `-3`).

---

## Block Types

Поле `body` хранит `Block[]`. TypeScript-типы:

```ts
export type Block =
  | { type: 'text';      html: string }
  | { type: 'photo';     s3Key: string; caption?: string }
  | { type: 'photoGrid'; columns: 2 | 3; photos: { s3Key: string; caption?: string }[] }
  | { type: 'panorama';  s3Key: string; caption?: string }
  | { type: 'embed';     html: string }
  | { type: 'quote';     text: string; author?: string }
  | { type: 'heading';   level: 2 | 3; text: string }
```

`embed.html` — iframe-код от платформы (Spotify, YouTube, TikTok). Рендерится через `dangerouslySetInnerHTML` — безопасно, так как HTML поступает только от автора.

---

## Routing

| Route | Компонент | Данные |
|---|---|---|
| `/` | `HomePage` | Featured пост + последние 12 published постов |
| `/[categorySlug]?page=N` | `CategoryPage` | Категория по slug + посты (12 на страницу), 404 если не найдена |
| `/post/[postSlug]` | `PostPage` | Пост по slug (только PUBLISHED), socialLinks, 404 если не найден |
| `/search?q=` | `SearchPage` | Динамический, full-text через `/api/search` |
| `/admin` | заглушка | Редирект на `/admin/login` (Phase 2) |

### Hero фона категории

1. Найти последний PUBLISHED пост в категории с фото-блоком
2. Взять `s3Key` → использовать как фоновое изображение шапки
3. Fallback: `category.gradientCss`
4. Fallback: дефолтный градиент из дизайн-системы

---

## API Routes

### `GET /api/health`
```json
{ "status": "ok", "timestamp": "2026-06-27T12:00:00.000Z" }
```

### `GET /api/search?q=<query>`
```json
{ "posts": [], "total": 0 }
```

### `POST /api/revalidate`
Требует `Authorization: Bearer <REVALIDATE_SECRET>`.
```json
{ "paths": ["/", "/photo", "/post/my-slug"] }
```

---

## Design System

### Токены

Источник: `docs/refs/designs/_ds/.../tokens/`. CSS-переменные:

```css
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
```

Шрифты (Google Fonts):
- **Manrope 700** — заголовки (замена Stem)
- **Jost 200–300** — тело (замена облегчённого гротеска)
- **Montserrat 600–700** — навигация UPPERCASE (замена Gilroy)
- **Lora italic** — цитаты

### Компоненты

| Компонент | Описание |
|---|---|
| `Logo` | SVG-лого, variant: white/black |
| `GradientSurface` | mesh-градиент + плёночное зерно |
| `MediaCard` | Карточка поста: обложка, категория, заголовок, дата |
| `SectionTitle` | Заголовок секции |
| `NavLine` | Навигация с разделителем `·` |
| `Tag` | Чип/пилюля |
| `Rating` | Звезда + число |
| `ThemeToggle` | Переключатель тёмная/светлая |
| `Header` | Лого + nav + поиск + ThemeToggle |
| `Footer` | powered by PHL·ART © 2026 |
| `BottomNav` | Мобильная нижняя навигация |
| `ReadingProgress` | Красная полоса прогресса чтения |
| `SocialLinks` | «Доступно также в» + платформы |

### BlockRenderer

Switch по `block.type`:
- `text` → DOMPurify + dangerouslySetInnerHTML
- `photo` → next/image + подпись
- `photoGrid` → CSS grid 2/3 col + next/image
- `panorama` → full-width next/image
- `embed` → dangerouslySetInnerHTML (без санитизации)
- `quote` → Lora italic + красная левая граница
- `heading` → h2/h3 Manrope 700

---

## Адаптив

Каждая публичная страница — сразу адаптивная. Ключевые трансформации:
- Хедер → гамбургер на мобайле
- Грид постов → одна колонка
- Фото-эссе многоколоночные → стек; триптих остаётся рядком из 3
- Hit-targets ≥ 44px

---

## Деплой

- PostgreSQL и Traefik — внешние, не в docker-compose этого проекта
- `docker-compose.yml` подключается к внешней сети `traefik`
- Healthcheck: `GET /api/health`
- Prisma migrations: `npx prisma migrate deploy` при первом деплое
- CORS скрипт: `scripts/setup-s3-cors.sh`
- `next.config.ts`: `remotePatterns` для S3 домена

---

## Env Variables

```
DATABASE_URL=
REVALIDATE_SECRET=
S3_ENDPOINT=
S3_REGION=default
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://art.ph1l74.com
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
ADMIN_ALLOWLIST=
```

---

## Out of Scope

- **Phase 2:** Студия публикаций (auth, редактор, S3 upload)
- **Phase 3:** Кросс-постинг (8 платформ)
- **Phase 4:** Telegram-миграция
