## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `next.config.js` (Note: Next.js 14 doesn't support .ts format for config)
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/styles/globals.css` (пустой, заполним в Task 2)
- Create: `src/app/layout.tsx` (минимальный)

**Interfaces:**
- Produces: запущенное `npm run dev`, `npm test`

- [ ] **Шаг 1: Инициализировать Next.js проект**

```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

- [ ] **Шаг 2: Установить зависимости**

```bash
npm install @prisma/client dompurify clsx tailwind-merge
npm install -D prisma vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @types/dompurify jsdom
```

- [ ] **Шаг 3: Настроить `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Шаг 4: Настроить `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Шаг 5: Добавить test-скрипт в `package.json`**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Шаг 6: Настроить `next.config.ts`**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.S3_ENDPOINT ?? 's3.firstvds.ru',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Шаг 7: Настроить `tailwind.config.ts`** (базовый, расширим в Task 2)

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
```

- [ ] **Шаг 8: Проверить что dev-сервер запускается**

```bash
npm run dev
```
Ожидание: сервер на `http://localhost:3000`, страница рендерится без ошибок.

- [ ] **Шаг 9: Проверить что тесты запускаются**

```bash
npm test
```
Ожидание: `No test files found` — нормально, тесты ещё не написаны.

- [ ] **Шаг 10: Коммит**

```bash
git add .
git commit -m "feat: scaffold Next.js 14 project with Vitest"
```

---
