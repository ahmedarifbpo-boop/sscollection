-- AlterTable
ALTER TABLE "VisitorLog" ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "eventData" JSONB,
ADD COLUMN     "referrer" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "visitorId" TEXT;

-- CreateIndex
CREATE INDEX "VisitorLog_visitorId_idx" ON "VisitorLog"("visitorId");

-- CreateIndex
CREATE INDEX "VisitorLog_sessionId_idx" ON "VisitorLog"("sessionId");

-- CreateIndex
CREATE INDEX "VisitorLog_productId_idx" ON "VisitorLog"("productId");
