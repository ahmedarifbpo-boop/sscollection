/*
  Warnings:

  - A unique constraint covering the columns `[reviewToken]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "reviewToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_reviewToken_key" ON "Order"("reviewToken");
