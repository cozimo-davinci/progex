/*
  Warnings:

  - You are about to drop the `JobPosting` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JobPosting" DROP CONSTRAINT "JobPosting_userId_fkey";

-- DropTable
DROP TABLE "JobPosting";

-- CreateTable
CREATE TABLE "ResumeApplication" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeKey" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "tailoredResumeKey" TEXT NOT NULL,
    "coverLetterKey" TEXT NOT NULL,
    "jobDescription" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeApplication_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ResumeApplication" ADD CONSTRAINT "ResumeApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
