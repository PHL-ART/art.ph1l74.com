# Task 1: Dependencies + Prisma migration

From plan: docs/superpowers/plans/2026-06-28-admin-dashboard.md

Files:
- Modify: package.json (via npm install)
- Modify: prisma/schema.prisma
- Create: prisma/migrations/20260628_add_scheduled_at/migration.sql (auto-generated)
- Modify: .env

Interfaces:
- Produces: Post.scheduledAt: DateTime? in Prisma schema and generated client

Step 1: Install packages
  npm install next-auth @reduxjs/toolkit react-redux redux-persist
  npm install --save-dev @types/redux-persist
  Expected: packages added to node_modules, package.json updated.

Step 2: Add scheduledAt to prisma/schema.prisma after publishedAt DateTime? on the Post model:
  scheduledAt   DateTime?

Step 3: Run migration
  npx prisma migrate dev --name add_scheduled_at
  Expected: migration created and applied

Step 4: Regenerate Prisma client
  npx prisma generate

Step 5: Add to .env:
  NEXT_PUBLIC_S3_BASE_URL=https://s3.firstvds.ru/phlart
  (replace with actual S3_ENDPOINT/S3_BUCKET from .env)

Step 6: Verify tests still pass
  npm test

Step 7: Commit
  git add prisma/schema.prisma prisma/migrations/ src/generated/ package.json package-lock.json .env
  git commit -m "feat: add scheduledAt to Post, install auth/redux deps"
