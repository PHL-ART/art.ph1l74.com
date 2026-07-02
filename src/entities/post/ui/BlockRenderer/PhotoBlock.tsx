import { getPostUrl } from '@/shared/lib/getPostUrl'
import { PhotoClickable } from './PhotoClickable'

export function PhotoBlock({ s3Key, caption }: { s3Key: string; caption?: string }) {
  const src = getPostUrl(s3Key)

  return (
    <figure>
      <PhotoClickable src={src} caption={caption} />
      {caption && (
        <figcaption className="mt-2 font-body text-[13px] text-caption text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
