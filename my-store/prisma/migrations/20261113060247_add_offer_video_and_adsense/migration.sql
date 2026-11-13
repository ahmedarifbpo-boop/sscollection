/*
  Warnings:

  - Added the required column `customerAddress` to the `ReturnRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPhone` to the `ReturnRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "video" TEXT,
ALTER COLUMN "image" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ReturnRequest" ADD COLUMN     "customerAddress" TEXT NOT NULL,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerPhone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "adsenseCode" TEXT,
ADD COLUMN     "adsenseEnabled" BOOLEAN NOT NULL DEFAULT false;
