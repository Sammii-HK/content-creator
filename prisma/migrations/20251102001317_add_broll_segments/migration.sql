-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "brollSegmentId" TEXT;

-- CreateTable
CREATE TABLE "broll_segments" (
    "id" TEXT NOT NULL,
    "brollId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" DOUBLE PRECISION NOT NULL,
    "endTime" DOUBLE PRECISION NOT NULL,
    "quality" INTEGER NOT NULL DEFAULT 5,
    "mood" TEXT,
    "description" TEXT,
    "tags" TEXT[],
    "isUsable" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "broll_segments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_brollSegmentId_fkey" FOREIGN KEY ("brollSegmentId") REFERENCES "broll_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broll_segments" ADD CONSTRAINT "broll_segments_brollId_fkey" FOREIGN KEY ("brollId") REFERENCES "broll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
