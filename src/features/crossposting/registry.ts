import { telegramProvider } from './providers/telegram'
import { vkProvider } from './providers/vk'
import { instagramProvider } from './providers/instagram'
import { threadsProvider } from './providers/threads'
import { tiktokProvider } from './providers/tiktok'
import type { CrossPostProvider } from './types'

export const registry: Record<string, CrossPostProvider> = {
  telegram: telegramProvider,
  vk: vkProvider,
  instagram: instagramProvider,
  threads: threadsProvider,
  tiktok: tiktokProvider,
}
