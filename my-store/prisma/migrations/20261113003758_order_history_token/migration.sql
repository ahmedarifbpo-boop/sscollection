-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "historyToken" VARCHAR(128);

-- CreateIndex
CREATE INDEX "Order_historyToken_idx" ON "Order"("historyToken");
