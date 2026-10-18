-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "storeName" TEXT NOT NULL DEFAULT 'S.S Collection',
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "freeShippingThreshold" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "shippingFee" DOUBLE PRECISION NOT NULL DEFAULT 250,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
