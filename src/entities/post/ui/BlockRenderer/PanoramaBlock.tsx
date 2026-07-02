import Image from 'next/image'
import { getPostUrl } from '@/shared/lib/getPostUrl'

export function PanoramaBlock({ s3Key, caption }: { s3Key: string; caption?: string }) {
  return (
    <figure className="-mx-5 md:-mx-12">
      <div className="relative w-full aspect-[21/9] overflow-hidden">
        <Image
          src={getPostUrl(s3Key)}
          alt={caption ?? ''}
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 px-5 md:px-12 font-body text-[13px] text-caption text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
