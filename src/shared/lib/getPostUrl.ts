export function getPostUrl(s3Key: string): string {
  const endpoint = process.env.S3_ENDPOINT
  const bucket = process.env.S3_BUCKET
  if (!endpoint || !bucket) {
    throw new Error('S3_ENDPOINT and S3_BUCKET environment variables must be set')
  }
  return `https://${endpoint}/${bucket}/${s3Key}`
}
