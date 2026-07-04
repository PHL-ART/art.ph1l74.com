import { prisma } from '@/shared/lib/prisma'
import { registry } from './registry'
import type { CrossPostPayload, CrossPostResult } from './types'

export async function crossPostToChannels(
  postId: string,
  channels: Record<string, boolean>,
): Promise<CrossPostResult[]> {
  const enabledSlugs = Object.entries(channels)
    .filter(([, enabled]) => enabled)
    .map(([slug]) => slug)

  if (enabledSlugs.length === 0) return []

  const socials = await prisma.social.findMany({
    where: { slug: { in: enabledSlugs }, type: 'CROSS_POSTING' },
    select: { id: true, slug: true, apiToken: true, config: true },
  })

  if (socials.length === 0) return []

  // MediaFile has no `order` field — omit orderBy (verified from prisma/schema.prisma)
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      slug: true,
      title: true,
      tags: { select: { slug: true } },
      mediaFiles: {
        where: { type: 'IMAGE' },
        take: 10,
        select: { key: true },
      },
    },
  })

  if (!post) {
    return socials.map(s => ({ slug: s.slug, success: false, error: 'Post not found' }))
  }

  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL ?? ''
  const payload: CrossPostPayload = {
    title: post.title,
    tags: post.tags.map(t => t.slug),
    imageUrls: post.mediaFiles.map(f => `${s3Base}/${f.key}`),
    postUrl: `https://ph1l74.art/post/${post.slug}`,
  }

  const settled = await Promise.allSettled(
    socials.map(social => {
      const provider = registry[social.slug]
      if (!provider) {
        return Promise.resolve<CrossPostResult>({
          slug: social.slug,
          success: false,
          error: `No provider registered for slug: ${social.slug}`,
        })
      }
      return provider.post(payload, {
        apiToken: social.apiToken ?? '',
        config: (social.config as Record<string, string>) ?? {},
      })
    }),
  )

  const results: CrossPostResult[] = settled.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : {
          slug: socials[i].slug,
          success: false,
          error: String((r as PromiseRejectedResult).reason?.message ?? 'Unknown error'),
        },
  )

  // Persist results to SocialLink (upsert to support re-publishing)
  await Promise.all(
    results.map((result, i) =>
      prisma.socialLink.upsert({
        where: { postId_socialId: { postId, socialId: socials[i].id } },
        update: { url: result.externalUrl ?? '', error: result.error ?? null },
        create: {
          postId,
          socialId: socials[i].id,
          url: result.externalUrl ?? '',
          error: result.error ?? null,
        },
      }),
    ),
  )

  return results
}
