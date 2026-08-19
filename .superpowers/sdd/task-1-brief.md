### Task 1: DB Schema — Add `config` to Social and `error` to SocialLink

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `Social.config: Json?`, `SocialLink.error: String?`

- [ ] **Step 1: Read the current schema**

Read `prisma/schema.prisma` and confirm:
- `Social` does NOT yet have a `config` field
- `SocialLink` does NOT yet have an `error` field

- [ ] **Step 2: Add `config` to Social model**

In `prisma/schema.prisma`, find the `Social` model and add `config Json?` after `apiToken String?`:

```prisma
model Social {
  id        String       @id @default(cuid())
  name      String
  slug      String       @unique
  iconUrl   String?
  type      SocialType   @default(AFTER_POSTING)
  apiToken  String?
  config    Json?
  createdAt DateTime     @default(now())
  links     SocialLink[]
}
```

- [ ] **Step 3: Add `error` to SocialLink model**

In `prisma/schema.prisma`, find the `SocialLink` model and add `error String?` after `url String`:

```prisma
model SocialLink {
  id        String   @id @default(cuid())
  url       String
  error     String?
  postId    String
  socialId  String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  social    Social   @relation(fields: [socialId], references: [id])
  createdAt DateTime @default(now())

  @@unique([postId, socialId])
}
```

- [ ] **Step 4: Run migration**

```bash
npx prisma migrate dev --name add_crossposting_config_and_social_link_error
```

Expected: migration file created under `prisma/migrations/`, applied successfully, no errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add config to Social and error to SocialLink for crossposting"
```

---

