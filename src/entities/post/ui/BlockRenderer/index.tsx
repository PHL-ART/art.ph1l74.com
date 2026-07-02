import type { Block } from '@/entities/post/types'
import { TextBlock } from './TextBlock'
import { PhotoBlock } from './PhotoBlock'
import { PhotoGridBlock } from './PhotoGridBlock'
import { PanoramaBlock } from './PanoramaBlock'
import { EmbedBlock } from './EmbedBlock'
import { QuoteBlock } from './QuoteBlock'
import { HeadingBlock } from './HeadingBlock'

type AnyBlock = Block | { type: 'image'; key: string; alt?: string }

export function BlockRenderer({ blocks }: { blocks: AnyBlock[] }) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'text':      return <TextBlock      key={i} {...block} />
          case 'photo':     return <PhotoBlock     key={i} {...block} />
          case 'image':     return <PhotoBlock     key={i} s3Key={block.key} caption={block.alt} />
          case 'photoGrid': return <PhotoGridBlock key={i} {...block} />
          case 'panorama':  return <PanoramaBlock  key={i} {...block} />
          case 'embed':     return <EmbedBlock     key={i} {...block} />
          case 'quote':     return <QuoteBlock     key={i} {...block} />
          case 'heading':   return <HeadingBlock   key={i} {...block} />
        }
      })}
    </div>
  )
}
