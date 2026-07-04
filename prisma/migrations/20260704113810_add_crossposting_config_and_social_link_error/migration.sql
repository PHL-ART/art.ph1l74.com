-- AlterTable
ALTER TABLE "Social" ADD COLUMN     "config" JSONB;

-- AlterTable
ALTER TABLE "SocialLink" ADD COLUMN     "error" TEXT;
