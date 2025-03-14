/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `userId` on the `job_application` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `resume` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `resume_application` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "job_application" DROP CONSTRAINT "job_application_userId_fkey";

-- DropForeignKey
ALTER TABLE "resume" DROP CONSTRAINT "resume_userId_fkey";

-- DropForeignKey
ALTER TABLE "resume_application" DROP CONSTRAINT "resume_application_userId_fkey";

-- AlterTable
ALTER TABLE "job_application" DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "resume" DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "resume_application" DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL;

-- DropTable
DROP TABLE "User";
