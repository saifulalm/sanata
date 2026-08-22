-- AlterTable
ALTER TABLE "Rab" ADD COLUMN     "scheduleStart" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RabItem" ADD COLUMN     "durationDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startOffsetDays" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RabProgress" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "percent" DECIMAL(5,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "RabProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RabProgress_itemId_date_idx" ON "RabProgress"("itemId", "date");

-- AddForeignKey
ALTER TABLE "RabProgress" ADD CONSTRAINT "RabProgress_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "RabItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RabProgress" ADD CONSTRAINT "RabProgress_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
