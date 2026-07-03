# Кросс-постинг — Design Spec
**Дата:** 2026-07-03  
**Статус:** Утверждён

---

## Цель

При нажатии «Опубликовать» в Студии (редактор или дашборд) пост автоматически публикуется на подключённых социальных платформах: заголовок, медиа-сетка (до 10 фото), текст подписи и хэштеги.

---

## Платформы

| Платформа   | API                          | Фото | Статус реализации |
|-------------|------------------------------|------|-------------------|
| Telegram    | Bot API `sendMediaGroup`     | 10   | Реализуем         |
| VKontakte   | VK API `wall.post` + photos  | 10   | Реализуем         |
| Instagram   | Meta Graph API Carousel      | 10   | Реализуем         |
| Threads     | Meta Graph API Threads       | 10   | Реализуем         |
| TikTok      | Content Posting API          | 35   | Стаб (требует одобрения TikTok App) |
| Bluesky     | AT Protocol                  | 4    | Исключён (мало фото) |
| Яндекс.Дзен | Статьи API                   | —    | Исключён (формат статьи, не пост) |
| MAX Мессенджер | Нет публичного API        | —    | Исключён          |

---

## Архитектура: Provider Pattern

### Новый слой `src/features/crossposting/`

```
src/features/crossposting/
  providers/
    telegram.ts      ← Bot API sendMediaGroup
    vk.ts            ← VK API photos + wall.post
    instagram.ts     ← Meta Graph API Carousel
    threads.ts       ← Meta Graph API Threads Carousel
    tiktok.ts        ← stub + setup instructions
  registry.ts        ← { slug → provider } lookup map
  types.ts           ← CrossPostPayload, CrossPostResult, CrossPostProvider
  crossPostToChannels.ts  ← оркестратор
```

### Типы (`types.ts`)

```typescript
export interface CrossPostProvider {
  slug: string
  post(payload: CrossPostPayload, config: SocialConfig): Promise<CrossPostResult>
}

export interface CrossPostPayload {
  title: string
  tags: string[]        // raw tag slugs из БД
  imageUrls: string[]   // S3 URLs из Post.mediaFiles (type=IMAGE), до 10 шт.
  postUrl: string       // https://ph1l74.art/post/{slug}
}

export interface SocialConfig {
  apiToken: string
  config: Record<string, string>  // channelId, groupId, pageId и т.д.
}

export interface CrossPostResult {
  slug: string          // идентификатор платформы
  success: boolean
  externalUrl?: string  // URL опубликованного поста на платформе
  error?: string
}
```

### Формат подписи

Каждый провайдер **самостоятельно** форматирует подпись из `CrossPostPayload`.  
Общая структура: `{title}\n\n{postUrl}\n\n{hashtags}`

- **VK:** хэштеги → `#тег@groupSlug` (groupSlug берётся из `config.groupSlug`)
- **Telegram / Instagram / Threads:** хэштеги → `#тег`
- **TikTok:** хэштеги как массив в API, отдельно от текста

Threads: если подпись > 500 символов — обрезается с `…`.

---

## Изменения в базе данных

### Миграция 1: добавить `config` в `Social`

```prisma
model Social {
  // существующие поля...
  apiToken  String?
  config    Json?      // { channelId, groupId, pageId, ... } per platform
}
```

### Миграция 2: добавить `error` в `SocialLink`

```prisma
model SocialLink {
  // существующие поля...
  url       String     // URL внешнего поста (пустая строка если ошибка)
  error     String?    // текст ошибки; null = успех
}
```

---

## Конфигурация платформ: поля по slug

| slug          | `apiToken`            | `config`                                    |
|---------------|-----------------------|---------------------------------------------|
| `telegram`    | Bot Token             | `{ channelId: "@channel или -100..." }`     |
| `vk`          | Community Token       | `{ groupId: "-123456", groupSlug: "phlart" }` |
| `instagram`   | Long-lived Access Token | `{ instagramAccountId: "...", pageId: "..." }` |
| `threads`     | Access Token          | `{ threadsUserId: "..." }`                  |
| `tiktok`      | Access Token          | `{ openId: "..." }` (stub)                  |

### UI страницы `/admin/services`

Форма добавления сервиса определяет поля **динамически по slug**:

- При выборе slug из списка (`telegram`, `vk`, `instagram`, `threads`, `tiktok`) — форма показывает нужные поля
- Данные сохраняются: `apiToken` → основной токен, остальные → `config` JSON

---

## Flow публикации (end-to-end)

```
Клик «Опубликовать» (редактор или дашборд)
  ↓
publishPost(postId, channelMap, scheduledAt?)
  ↓
  1. DB: Post.status → PUBLISHED, publishedAt = now()
  2. revalidatePath('/', '/post/{slug}', '/{categorySlug}')
  3. crossPostToChannels(postId, enabledSlugs[])
       ↓
       a. SELECT Social WHERE slug IN enabledSlugs AND type = CROSS_POSTING
       b. SELECT Post + tags + mediaFiles
       c. Параллельно: provider.post(payload, config) для каждой платформы
       d. UPSERT SocialLink (postId, socialId, url, error) per result
       e. return CrossPostResult[]
  4. return { success: true, results: CrossPostResult[] }
  ↓
UI отображает per-platform статусы
```

**Принцип:** публикация на сайте НЕ блокируется ошибками провайдеров. Все провайдеры вызываются параллельно через `Promise.allSettled`.

---

## UI: MetadataPanel (редактор)

### Новая секция «Каналы»
Расположение: между медиатекой и полем «Публикация» (datetime-local).

```
[ КАНАЛЫ ]
● Telegram      ████ ON
● VKontakte     ████ ON
● Instagram     ████ ON
● Threads       ████ OFF
```

- Тоглы загружаются из `/api/admin/services?type=CROSS_POSTING`
- Состояние хранится в `channelMap: Record<string, boolean>` (уже есть в `PostEditor`)
- Нужно прокинуть `providers[]` и `onChannelToggle` в `MetadataPanel` (сейчас не прокидывается)

### После публикации
Под кнопкой «Опубликовать» появляется блок результатов:

```
✅ Telegram — опубликовано
✅ VKontakte — опубликовано
❌ Instagram — ошибка: invalid_token
```

`publishPost` расширяется: возвращает `results: CrossPostResult[]` вместо просто `error?: string`.

---

## UI: CrossPostingPanel (дашборд)

Существующий компонент уже показывает тоглы и кнопку публикации.  
Изменения:
- `handlePublish` в `AdminDashboard` после `publishPost` получает `results` и передаёт в `CrossPostingPanel`
- `CrossPostingPanel` показывает те же per-platform статусы под кнопкой

---

## API: изменения в `publishPost` (server action)

```typescript
// было
export async function publishPost(
  postId: string,
  channels: Record<string, boolean>,
  scheduledAt?: string,
): Promise<{ success: boolean; error?: string }>

// стало
export async function publishPost(
  postId: string,
  channels: Record<string, boolean>,
  scheduledAt?: string,
): Promise<{ success: boolean; error?: string; results?: CrossPostResult[] }>
```

---

## API: изменения в `/api/admin/services`

### POST (существующий)
Добавить сохранение `config` поля:
```json
{ "name": "Telegram", "slug": "telegram", "type": "CROSS_POSTING",
  "apiToken": "bot_token_here",
  "config": { "channelId": "@phlart_channel" } }
```

### PUT `/api/admin/services/[id]` (новый)
Обновление существующего сервиса (для редактирования токенов).

---

## Провайдер: Telegram

**Зависимость:** встроенный `fetch`, no npm package needed.  
**Алгоритм:**
1. Если `imageUrls.length === 0` → `sendMessage` с текстом
2. Если `imageUrls.length === 1` → `sendPhoto` с caption
3. Если `imageUrls.length > 1` → `sendMediaGroup` (первый элемент получает caption)
4. Ответ содержит `message_id` → `externalUrl = https://t.me/{channelUsername}/{message_id}` (только для публичных каналов; для приватных — пустая строка)

**Лимиты:** caption ≤ 1024 символа для MediaGroup.

---

## Провайдер: VKontakte

**Зависимость:** встроенный `fetch`.  
**Алгоритм:**
1. `photos.getUploadServer({ group_id })` для каждой фотографии
2. POST файл на upload URL
3. `photos.saveWallPhoto({ photo, server, hash })` → получаем attachment string
4. `wall.post({ owner_id: -groupId, message, attachments: photos.join(',') })`
5. Ответ содержит `post_id` → `externalUrl = https://vk.com/wall-{groupId}_{post_id}`

**Хэштеги:** `#тег@groupSlug` формируются в провайдере из `config.groupSlug`.

---

## Провайдер: Instagram

**Зависимость:** встроенный `fetch`, Meta Graph API v19+.  
**Алгоритм для Carousel (≥2 фото):**
1. Для каждого imageUrl: `POST /v19.0/{igAccountId}/media?image_url=...&is_carousel_item=true`
2. `POST /v19.0/{igAccountId}/media?media_type=CAROUSEL&children={ids}&caption=...`
3. `POST /v19.0/{igAccountId}/media_publish?creation_id={carouselId}`
4. `externalUrl = https://www.instagram.com/p/{shortcode}`

**Для одного фото:** `POST /v19.0/{igAccountId}/media?image_url=...&caption=...` → publish.

**Настройка:** требует Facebook Page + Instagram Business Account + долгоживущий токен (60 дней).

---

## Провайдер: Threads

**Зависимость:** встроенный `fetch`, Meta Graph API (Threads endpoint).  
**Алгоритм для Carousel:**
1. Для каждого imageUrl: `POST /v1.0/{threadsUserId}/threads?media_type=IMAGE&image_url=...&is_carousel_item=true`
2. `POST /v1.0/{threadsUserId}/threads?media_type=CAROUSEL&children={ids}&text=...`
3. `POST /v1.0/{threadsUserId}/threads_publish?creation_id={carouselId}`

**Лимит:** текст ≤ 500 символов → обрезается с `…`.

---

## Провайдер: TikTok (stub)

**Статус:** заглушка. TikTok Content Posting API требует одобрения TikTok Developer Platform.  
**Что реализовано:** метод `post()` возвращает `{ success: false, error: 'TikTok: manual setup required' }`.  
**Инструкция по настройке:** см. [TikTok for Developers](https://developers.tiktok.com/products/content-posting-api/).

---

## Обработка ошибок

- Ошибки провайдеров **не блокируют** публикацию на сайте
- `Promise.allSettled` — все провайдеры вызываются параллельно
- `rejected` promise → `CrossPostResult { success: false, error: reason.message }`
- Результаты сохраняются в `SocialLink` (в т.ч. с `error`)
- UI показывает per-platform статус в обоих flow (редактор + дашборд)

---

## Что НЕ входит в эту задачу

- Шедулер постов (отложенная публикация) — отдельная фича
- Retry упавших платформ из UI — v2
- Видео-публикации — только фото
- Автоматический refresh токенов (Meta tokens истекают) — v2
