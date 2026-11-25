-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "adsterraCode" TEXT,
ADD COLUMN     "adsterraEnabled" BOOLEAN NOT NULL DEFAULT false;
