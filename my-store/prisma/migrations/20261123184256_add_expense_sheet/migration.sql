-- CreateTable
CREATE TABLE "ExpenseSheetRow" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL DEFAULT '',
    "actualPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "websitePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "personalExpense" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "businessExpense" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountSalePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountQuantity" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "customValues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseSheetRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseSheetSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "accountBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualCountedBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseSheetSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseSheetPayment" (
    "id" TEXT NOT NULL,
    "person" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseSheetPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseSheetColumn" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'TEXT',
    "formula" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseSheetColumn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseSheetRow_date_idx" ON "ExpenseSheetRow"("date");

-- CreateIndex
CREATE INDEX "ExpenseSheetRow_productId_idx" ON "ExpenseSheetRow"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseSheetRow_date_productId_key" ON "ExpenseSheetRow"("date", "productId");

-- CreateIndex
CREATE INDEX "ExpenseSheetPayment_person_date_idx" ON "ExpenseSheetPayment"("person", "date");

-- CreateIndex
CREATE INDEX "ExpenseSheetColumn_position_idx" ON "ExpenseSheetColumn"("position");

-- AddForeignKey
ALTER TABLE "ExpenseSheetRow" ADD CONSTRAINT "ExpenseSheetRow_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
