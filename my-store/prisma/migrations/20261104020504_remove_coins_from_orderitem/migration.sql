/*
  Warnings:

  - You are about to drop the column `coinsEarned` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `coinsUsed` on the `OrderItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "canRefer" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "coinsEarned",
DROP COLUMN "coinsUsed";
