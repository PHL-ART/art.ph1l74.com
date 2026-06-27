# Deployment Notes

## First Deploy

Before the app can serve requests, run Prisma migrations against the production database:

```bash
docker exec phlart-web-1 npx prisma migrate deploy
```

Or add a startup script to the container. The migration must run once per new deployment if the schema changed.

## S3 CORS

Run once before first deploy:
```bash
export S3_ENDPOINT=s3.firstvds.ru
export S3_BUCKET=your-bucket
export S3_REGION=default
export S3_ACCESS_KEY=...
export S3_SECRET_KEY=...
export CORS_JSON='{"CORSRules":[{"AllowedOrigins":["https://art.ph1l74.com","http://localhost:3000"],"AllowedMethods":["PUT","GET","HEAD"],"AllowedHeaders":["Content-Type","x-amz-acl"],"MaxAgeSeconds":3600}]}'
bash scripts/setup-s3-cors.sh
```
