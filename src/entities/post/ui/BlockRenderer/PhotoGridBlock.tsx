import Image from 'next/image'
import { getPostUrl } from '@/shared/lib/getPostUrl'

export function PhotoGridBlock({
  columns,
  photos,
}: {
  columns: 2 | 3
  photos: { s3Key: string; caption?: string }[]
}) {
  return (
    <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {photos.map((photo, i) => (
        <figure key={i}>
          <div className="relative w-full aspect-[2/3] rounded-[2px] overflow-hidden">
            <Image
              src={getPostUrl(photo.s3Key)}
              alt={photo.caption ?? ''}
              fill
              className="object-cover"
              sizes="33vw"
            />
          </div>
          {photo.caption && (
            <figcaption className="mt-1 font-body text-[11px] text-caption text-center">
              {photo.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}
