-- 1. Category table update (slug add karna)
ALTER TABLE "Category" ADD COLUMN "slug" TEXT;
UPDATE "Category" SET "slug" = 'category-' || "id";
ALTER TABLE "Category" ALTER COLUMN "slug" SET NOT NULL;

-- 2. Product table update (slug aur meta fields add karna)
ALTER TABLE "Product" ADD COLUMN "metaDescription" TEXT,
ADD COLUMN "metaTitle" TEXT,
ADD COLUMN "slug" TEXT;
UPDATE "Product" SET "slug" = 'product-' || "id";
ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;

-- 3. VisitorLog table update (naye tracking fields)
ALTER TABLE "VisitorLog" ADD COLUMN "browser" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "deviceType" TEXT,
ADD COLUMN "eventType" TEXT NOT NULL DEFAULT 'page_view',
ADD COLUMN "productId" TEXT,
ADD COLUMN "trafficSource" TEXT;

-- 4. Create Indexes
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "ChatMessage_conversationId_idx" ON "ChatMessage"("conversationId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_slug_idx" ON "Product"("slug");
CREATE INDEX "ReferralLog_referrerCode_idx" ON "ReferralLog"("referrerCode");
CREATE INDEX "VisitorLog_createdAt_idx" ON "VisitorLog"("createdAt");
CREATE INDEX "VisitorLog_eventType_idx" ON "VisitorLog"("eventType");