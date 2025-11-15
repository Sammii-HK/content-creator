-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- AlterTable: Add userId to videos
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- AlterTable: Add userId to broll
ALTER TABLE "broll" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- AlterTable: Add userId to templates (nullable)
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- AlterTable: Add userId to voice_profiles
ALTER TABLE "voice_profiles" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- AddForeignKey: Videos -> Users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'videos_userId_fkey'
    ) THEN
        ALTER TABLE "videos" 
        ADD CONSTRAINT "videos_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: Broll -> Users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'broll_userId_fkey'
    ) THEN
        ALTER TABLE "broll" 
        ADD CONSTRAINT "broll_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: Templates -> Users (nullable)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'templates_userId_fkey'
    ) THEN
        ALTER TABLE "templates" 
        ADD CONSTRAINT "templates_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: VoiceProfiles -> Users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'voice_profiles_userId_fkey'
    ) THEN
        ALTER TABLE "voice_profiles" 
        ADD CONSTRAINT "voice_profiles_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Make userId required for videos (after adding foreign key)
DO $$
BEGIN
    -- Check if there are any existing videos without userId
    IF EXISTS (SELECT 1 FROM "videos" WHERE "userId" IS NULL) THEN
        -- Create a default user for existing data
        INSERT INTO "users" ("id", "email", "password", "name", "createdAt", "updatedAt")
        VALUES ('migration-default-user', 'migration@example.com', '$2a$10$placeholder', 'Migration User', NOW(), NOW())
        ON CONFLICT ("id") DO NOTHING;
        
        -- Assign existing videos to default user
        UPDATE "videos" SET "userId" = 'migration-default-user' WHERE "userId" IS NULL;
    END IF;
    
    -- Make userId NOT NULL for videos
    ALTER TABLE "videos" ALTER COLUMN "userId" SET NOT NULL;
END $$;

-- Make userId required for broll (after adding foreign key)
DO $$
BEGIN
    -- Check if there are any existing broll without userId
    IF EXISTS (SELECT 1 FROM "broll" WHERE "userId" IS NULL) THEN
        -- Ensure default user exists
        INSERT INTO "users" ("id", "email", "password", "name", "createdAt", "updatedAt")
        VALUES ('migration-default-user', 'migration@example.com', '$2a$10$placeholder', 'Migration User', NOW(), NOW())
        ON CONFLICT ("id") DO NOTHING;
        
        -- Assign existing broll to default user
        UPDATE "broll" SET "userId" = 'migration-default-user' WHERE "userId" IS NULL;
    END IF;
    
    -- Make userId NOT NULL for broll
    ALTER TABLE "broll" ALTER COLUMN "userId" SET NOT NULL;
END $$;

-- Make userId required for voice_profiles (after adding foreign key)
DO $$
BEGIN
    -- Check if there are any existing voice_profiles without userId
    IF EXISTS (SELECT 1 FROM "voice_profiles" WHERE "userId" IS NULL) THEN
        -- Ensure default user exists
        INSERT INTO "users" ("id", "email", "password", "name", "createdAt", "updatedAt")
        VALUES ('migration-default-user', 'migration@example.com', '$2a$10$placeholder', 'Migration User', NOW(), NOW())
        ON CONFLICT ("id") DO NOTHING;
        
        -- Assign existing voice_profiles to default user
        UPDATE "voice_profiles" SET "userId" = 'migration-default-user' WHERE "userId" IS NULL;
    END IF;
    
    -- Make userId NOT NULL for voice_profiles
    ALTER TABLE "voice_profiles" ALTER COLUMN "userId" SET NOT NULL;
END $$;
