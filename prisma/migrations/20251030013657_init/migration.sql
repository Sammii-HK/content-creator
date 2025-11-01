-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "hookLines" TEXT[],
    "caption" TEXT NOT NULL,
    "templateId" TEXT,
    "brollId" TEXT,
    "fileUrl" TEXT NOT NULL,
    "features" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "views" INTEGER,
    "likes" INTEGER,
    "shares" INTEGER,
    "comments" INTEGER,
    "completionRate" DOUBLE PRECISION,
    "engagement" DOUBLE PRECISION,
    "visualScore" DOUBLE PRECISION,
    "toneScore" DOUBLE PRECISION,
    "predictedScore" DOUBLE PRECISION,
    "actualScore" DOUBLE PRECISION,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "json" JSONB NOT NULL,
    "parentId" TEXT,
    "performance" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trends" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "popularity" INTEGER NOT NULL,
    "mood" TEXT,
    "category" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broll" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "category" TEXT,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_tests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "ab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_test_variants" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "isControl" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER,
    "engagement" DOUBLE PRECISION,
    "conversionRate" DOUBLE PRECISION,

    CONSTRAINT "ab_test_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_queue" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "platform" TEXT NOT NULL,
    "postId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "modelPath" TEXT NOT NULL,
    "performance" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "trainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ml_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "metrics_videoId_key" ON "metrics"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "trends_tag_platform_key" ON "trends"("tag", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "ml_models_name_version_key" ON "ml_models"("name", "version");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_brollId_fkey" FOREIGN KEY ("brollId") REFERENCES "broll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_test_variants" ADD CONSTRAINT "ab_test_variants_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ab_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_test_variants" ADD CONSTRAINT "ab_test_variants_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_queue" ADD CONSTRAINT "content_queue_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
