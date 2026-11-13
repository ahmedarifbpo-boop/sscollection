/*
  Warnings:

  - A unique constraint covering the columns `[historyToken]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "historyToken" VARCHAR(128);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_historyToken_key" ON "Customer"("historyToken");
