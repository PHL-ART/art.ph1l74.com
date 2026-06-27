import Image from 'next/image'
import { getPostUrl } from '@/shared/lib/getPostUrl'

export function PhotoBlock({ s3Key, caption }: { s3Key: string; caption?: string }) {
  return (
    <figure>
      <div className="relative w-full aspect-[3/2] rounded-[2px] overflow-hidden">
        <Image
          src={getPostUrl(s3Key)}
          alt={caption ?? ''}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 860px"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 font-body text-[13px] text-caption text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
