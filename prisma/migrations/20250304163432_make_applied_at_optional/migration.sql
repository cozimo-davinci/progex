-- AlterTable
ALTER TABLE "JobApplication" ALTER COLUMN "applied_at" DROP NOT NULL,
ALTER COLUMN "applied_at" DROP DEFAULT;
