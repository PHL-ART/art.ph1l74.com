import Image from 'next/image'
import { getPostUrl } from '@/shared/lib/getPostUrl'
import { CARD_GRADIENTS } from '@/shared/lib/gradients'

interface PostThumbnailProps {
  coverImageKey?: string | null
  title: string
  /** Градиент-заглушка, если нет обложки */
  placeholderGradient?: string
  /** Индекс в списке для выбора градиента из палитры по кругу */
  index?: number
  width?: number | string
  height?: number | string
  sizes?: string
  className?: string
}

/**
 * Обложка поста: если есть coverImageKey — показывает изображение,
 * иначе — цветной градиент-заглушка из палитры CARD_GRADIENTS.
 */
export function PostThumbnail({
  coverImageKey,
  title,
  placeholderGradient,
  index = 0,
  width = '100%',
  height = '100%',
  sizes = '(max-width: 768px) 100vw, 33vw',
  className,
}: PostThumbnailProps) {
  const gradient = placeholderGradient ?? CARD_GRADIENTS[index % CARD_GRADIENTS.length]

  return (
    <div
      className={`relative overflow-hidden ${className ?? ''}`}
      style={{ width, height }}
    >
      {coverImageKey ? (
        <Image
          src={getPostUrl(coverImageKey)}
          alt={title}
          fill
          className="object-cover"
          sizes={sizes}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: gradient }} />
      )}
    </div>
  )
}
