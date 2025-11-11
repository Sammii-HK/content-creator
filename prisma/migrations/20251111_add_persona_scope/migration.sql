-- Add persona linkage columns
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "persona_id" TEXT REFERENCES "voice_profiles"("id") ON DELETE SET NULL;
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "persona_id" TEXT REFERENCES "voice_profiles"("id") ON DELETE SET NULL;
ALTER TABLE "broll" ADD COLUMN IF NOT EXISTS "persona_id" TEXT REFERENCES "voice_profiles"("id") ON DELETE SET NULL;
ALTER TABLE "content_queue" ADD COLUMN IF NOT EXISTS "persona_id" TEXT REFERENCES "voice_profiles"("id") ON DELETE SET NULL;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "persona_id" TEXT REFERENCES "voice_profiles"("id") ON DELETE SET NULL;
ALTER TABLE "generated_images" ADD COLUMN IF NOT EXISTS "persona_id" TEXT REFERENCES "voice_profiles"("id") ON DELETE SET NULL;
ALTER TABLE "ai_usage" ADD COLUMN IF NOT EXISTS "persona_id" TEXT REFERENCES "voice_profiles"("id") ON DELETE SET NULL;
