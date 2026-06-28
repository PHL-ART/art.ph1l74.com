# Spec: Admin Dashboard (Phase 2 — Studio)

**Date:** 2026-06-28
**Project:** PHL·ART
**Status:** Approved

---

## Scope

Реализация защищённого дашборда студии публикаций (`/admin/dashboard`).

**Включает:**
- NextAuth авторизация (GitHub OAuth + allowlist)
- Prisma-миграция: поле `scheduledAt` на Post
- RTK slice + redux-persist для UI-стейта (месяц, выбранный пост)
- Дашборд: календарь, панель кросс-постинга, архив
- Server Action публикации поста с инвалидацией кэша

**Не включает:**
- Редактор статей (следующая фаза)
- Реальные VK/TG API (заглушки-хуки)
- S3 upload
- Таблица сервисов кросс-постинга (отдельная будущая схема)

---

## 1. Авторизация

**Пакет:** `next-auth@4`  
**Провайдер:** GitHub OAuth

```
src/
  middleware.ts                          ← matcher: /admin/((?!login).*)
  lib/
    auth.ts                              ← NextAuth config
  app/
    api/auth/[...nextauth]/route.ts      ← NextAuth handler
    (admin)/login/page.tsx               ← страница входа
```

**`lib/auth.ts`:**
- `GitHubProvider` с `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `signIn` callback: проверяет `profile.email` входит в `ADMIN_ALLOWLIST` (env, список через запятую)
- Стратегия: JWT (stateless, без сессионной таблицы в БД)
- `secret`: `NEXTAUTH_SECRET`

**`middleware.ts`:**
- matcher: все `/admin/*` кроме `/admin/login` и `/api/auth/*`
- Без валидной сессии → редирект на `/admin/login`

**Login page:**
- Тёмный фон (`#0e0a0b`), лого PHL·ART по центру
- Кнопка «Войти через GitHub» → `signIn('github')`
- Редирект после входа → `/admin/dashboard`

---

## 2. Схема Prisma

Единственное изменение — добавить `scheduledAt` к `Post`:

```prisma
model Post {
  // ...существующие поля...
  scheduledAt   DateTime?   // целевая дата/время выхода (DRAFT + SCHEDULED)
}
```

**Логика дат:**
- `scheduledAt` — когда автор планирует опубликовать (выставляется в редакторе)
- `publishedAt` — когда фактически опубликовано (ставится Server Action при публикации)
- Календарь: PUBLISHED посты → по `publishedAt`; DRAFT/SCHEDULED → по `scheduledAt`

**Миграция:** ненарушающая (nullable поле, нет дефолта, существующие записи не затрагиваются).

---

## 3. Redux Store

**Новые пакеты:** `@reduxjs/toolkit`, `react-redux`, `redux-persist`

```
src/
  shared/
    store/
      index.ts        ← configureStore + redux-persist (localStorage)
      provider.tsx    ← <Provider store> + <PersistGate> ('use client')
  features/
    admin/
      model/
        adminSlice.ts ← RTK slice
```

**`adminSlice` state:**

```ts
interface AdminState {
  currentYear: number        // default: new Date().getFullYear()
  currentMonth: number       // default: new Date().getMonth() + 1 (1–12)
  selectedPostId: string | null
  channelOverrides: Record<string, { vk?: boolean; tg?: boolean }>
}
```

**Actions:**
- `setMonth({ year, month })` — смена отображаемого месяца
- `setSelectedPostId(id | null)` — выбор поста
- `setChannelOverride({ postId, channel, enabled })` — VK/TG тогл

**Персистенция:** `redux-persist` whitelist `['admin']` → `localStorage`. При первом визите стейт инициализируется дефолтами (текущий месяц).

**Что НЕ в Redux:** данные постов из Prisma — локальный стейт `AdminDashboard`, рефетчится при смене месяца.

---

## 4. Файловая структура

```
src/
  middleware.ts
  lib/
    auth.ts
  shared/
    store/
      index.ts
      provider.tsx
  features/
    admin/
      model/
        adminSlice.ts
      ui/
        AdminDashboard.tsx      ← Client: оркестратор (стор + fetch + стейт)
        AdminSidebar.tsx        ← иконки-навигация (только десктоп)
        AdminTopbar.tsx         ← заголовок + табы + кнопка «Новый пост»
        AdminCalendar.tsx       ← грид календаря
        AdminAgenda.tsx         ← «Ближайшие публикации» (только мобайл)
        CrossPostingPanel.tsx   ← панель выбранного поста + тоглы
        AdminArchive.tsx        ← таблица/список постов
        AdminBottomNav.tsx      ← bottom nav (только мобайл)
      actions/
        publishPost.ts          ← Server Action
      queries.ts                ← Prisma-запросы
      types.ts                  ← AdminPost тип
  app/
    api/
      auth/[...nextauth]/route.ts
      admin/
        posts/route.ts          ← GET /api/admin/posts?year=&month=
    (admin)/
      layout.tsx                ← тёмная тема + ReduxProvider
      login/page.tsx
      dashboard/
        page.tsx                ← тонкий Server Component → <AdminDashboard>
```

---

## 5. Роутинг

| Маршрут | Доступ | Компонент |
|---|---|---|
| `/admin` | protected | редирект → `/admin/dashboard` |
| `/admin/login` | публичный | `LoginPage` |
| `/admin/dashboard` | protected | `DashboardPage` → `AdminDashboard` |

---

## 6. Компоненты дашборда

### AdminDashboard (Client Component)

Оркестратор. Читает `(currentYear, currentMonth, selectedPostId, channelOverrides)` из Redux store. При изменении месяца — `useEffect` fetches `/api/admin/posts?year=&month=` и пишет в локальный `useState<AdminPost[]>`.

Рендерит:
- Десктоп: `AdminSidebar` + `AdminTopbar` + `AdminCalendar` + `CrossPostingPanel` + `AdminArchive`
- Мобайл: `AdminTopbar` + tabs + `AdminCalendar` + `AdminAgenda` + `CrossPostingPanel` + `AdminArchive` + `AdminBottomNav`

### AdminCalendar

Props: `posts: AdminPost[]`, `year: number`, `month: number`, `selectedPostId: string | null`, `onSelectPost: (id: string) => void`, `onNavigate: (year: number, month: number) => void`.

**Десктоп:** ячейки min-height 98px, отображают карточки постов (точка + время + заголовок truncated).  
**Мобайл:** ячейки 46px, только номер + цветные точки.  
Ячейки соседнего месяца — dim (`rgba(255,255,255,0.22)`).  
Выбранный пост: `box-shadow: inset 0 0 0 1px #ff3b30`.

Цвета статусов:
- `published` → `#3ec27a`
- `scheduled` → `#ffb02e`
- `draft` → `rgba(255,255,255,0.4)`

### CrossPostingPanel

Props: `post: AdminPost | null`, `overrides: { vk?: boolean; tg?: boolean }`, `onToggle: (channel, val) => void`, `onPublish: () => void`.

**Empty state:** иконка upload + текст «Выберите пост в календаре».  
**Selected state:**
- Обложка: `coverImageKey` → S3 URL, fallback — CSS градиент
- Категория · статус
- VK / TG тоглы (красный = on, серый = off)
- Время выхода: `scheduledAt` (read-only)
- Кнопка «Опубликовать» — disabled если `status === PUBLISHED`

На мобайле: обложка 74×74px слева от метаданных (горизонтальный блок).

### AdminAgenda (только мобайл)

Props: `posts: AdminPost[]`, `selectedPostId: string | null`, `onSelectPost: (id: string) => void`.

Показывает посты со `status !== PUBLISHED`, отсортированные по `scheduledAt`. Каждая строка: обложка 46×46 + цветная точка + категория + время (`scheduledAt`) + заголовок + стрелка. Клик → `onSelectPost`. Выбранная строка — `box-shadow: inset 0 0 0 1px #ff3b30`.

### AdminArchive

Последние 20 PUBLISHED постов (отдельный запрос, не зависит от календарного месяца).

**Десктоп:** таблица — материал (38×38 миниатюра + заголовок) | раздел | дата | каналы (VK/TG бейджи) | охват (`—`).  
**Мобайл:** карточки-строки — 44×44 миниатюра + заголовок + категория + дата + охват.

### AdminSidebar (только `lg:`)

72px ширина, `background: #0a0708`. Иконки: лого, calendar (активный — `rgba(255,59,48,0.14)` фон + красный цвет), list, upload, photo. Внизу — аватар-заглушка (градиент-круг).

### AdminBottomNav (только мобайл)

`position: fixed; bottom: 0`. Иконки: calendar (активный красный), list, upload, photo, аватар. Фон `#0a0708`, top border hairline.

---

## 7. API Route: `/api/admin/posts`

```ts
// GET /api/admin/posts?year=2026&month=6
// Требует валидной сессии NextAuth (проверяется через getServerSession)
// Returns: { calendarPosts: AdminPost[], archivePosts: AdminPost[] }
```

**`calendarPosts`:** посты, у которых `publishedAt` или `scheduledAt` попадает в запрошенный месяц.  
**`archivePosts`:** последние 20 PUBLISHED постов (независимо от месяца).

```ts
type AdminPost = {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'
  scheduledAt: string | null   // ISO
  publishedAt: string | null   // ISO
  coverImageKey: string | null
  categories: { name: string; slug: string }[]
}
```

---

## 8. Server Action: `publishPost`

```ts
// features/admin/actions/publishPost.ts
'use server'

async function publishPost(postId: string): Promise<{ success: boolean; error?: string }>
```

**Шаги:**
1. Проверить сессию (getServerSession) — 401 если нет
2. `prisma.post.update`: `status = PUBLISHED`, `publishedAt = new Date()`
3. `revalidatePath('/')`, `revalidatePath('/[categorySlug]', 'layout')`, `revalidatePath('/post/[postSlug]', 'page')`
4. Вызвать `crossPostToChannels(postId, channels)` — заглушка (`console.log`)
5. Return `{ success: true }`

---

## 9. Лейаут и адаптив

**Тема:** только тёмная — `data-theme="dark"` зафиксирован в `(admin)/layout.tsx`. Переключателя темы нет.

**Десктоп (`lg:`):**
```
[AdminSidebar 72px] | [workspace: AdminTopbar / (AdminCalendar + CrossPostingPanel) / AdminArchive]
```

**Мобайл:**
```
[AdminTopbar compact] / [tabs] / [AdminCalendar dots] / [AdminAgenda] / [CrossPostingPanel] / [AdminArchive] / [AdminBottomNav fixed]
```

**Ключевые breakpoints:**
- `hidden lg:flex` — AdminSidebar
- `flex lg:hidden` — AdminBottomNav
- Calendar cells: `min-h-[98px]` (lg) / `min-h-[46px]` (мобайл)
- CrossPostingPanel: колонка справа 360px (lg) / full-width stacked (мобайл)
- Archive: таблица (lg) / карточки (мобайл)

**Hit targets:** ≥ 44px на мобайле.

---

## 10. Env Variables (дополнения)

Уже в `.env`:
```
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://art.ph1l74.com
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
ADMIN_ALLOWLIST=          # email через запятую, напр. user@example.com
```

---

## Out of Scope

- Редактор статей (`/admin/post/[id]`) — Phase 2b
- VK/TG API интеграции — отдельная фаза с таблицей провайдеров
- Реальные данные охвата (reach) из внешних платформ
- Пагинация архива (первые 20 постов достаточно)
- Смена статуса PUBLISHED → DRAFT (unpublish)
