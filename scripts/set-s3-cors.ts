/**
 * Run once to configure CORS on the S3 bucket so browsers can PUT files directly.
 * Usage: npx tsx scripts/set-s3-cors.ts
 */
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const s3 = new S3Client({
  region: process.env.S3_REGION ?? 'default',
  endpoint: `https://${process.env.S3_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

async function main() {
  await s3.send(new PutBucketCorsCommand({
    Bucket: process.env.S3_BUCKET!,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: ['*'],
          AllowedMethods: ['PUT', 'GET', 'HEAD'],
          AllowedHeaders: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }))
  console.log(`✓ CORS configured on bucket: ${process.env.S3_BUCKET}`)
}

main().catch(err => { console.error(err); process.exit(1) })
