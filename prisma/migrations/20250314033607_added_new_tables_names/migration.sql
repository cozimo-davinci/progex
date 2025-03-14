/*
  Warnings:

  - You are about to drop the `JobApplication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Resume` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResumeApplication` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_userId_fkey";

-- DropForeignKey
ALTER TABLE "Resume" DROP CONSTRAINT "Resume_userId_fkey";

-- DropForeignKey
ALTER TABLE "ResumeApplication" DROP CONSTRAINT "ResumeApplication_userId_fkey";

-- DropTable
DROP TABLE "JobApplication";

-- DropTable
DROP TABLE "Resume";

-- DropTable
DROP TABLE "ResumeApplication";

-- CreateTable
CREATE TABLE "resume" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "resumeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_application" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeKey" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "tailoredResumeKey" TEXT NOT NULL,
    "coverLetterKey" TEXT NOT NULL,
    "jobDescription" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "link" TEXT NOT NULL,
    "applied_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_application_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "resume" ADD CONSTRAINT "resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_application" ADD CONSTRAINT "resume_application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_application" ADD CONSTRAINT "job_application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
