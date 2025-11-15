# Production Database Migration Instructions

## Overview
This migration adds user authentication to your application by:
1. Creating a `users` table
2. Adding `userId` foreign keys to `videos`, `broll`, `templates`, and `voice_profiles` tables
3. Migrating existing data to a default user account

## Prerequisites
- PostgreSQL database with existing schema
- `DATABASE_URL` environment variable set
- Access to production database

## Migration Steps

### Option 1: Using Prisma Migrate Deploy (Recommended)

```bash
# Set your production database URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Generate Prisma Client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy
```

### Option 2: Using the Migration Script

```bash
# Make script executable (if not already)
chmod +x run-production-migration.sh

# Set DATABASE_URL and run
export DATABASE_URL="postgresql://user:password@host:port/database"
./run-production-migration.sh
```

### Option 3: Manual SQL Execution

If you prefer to run SQL directly:

```bash
# Connect to your database
psql $DATABASE_URL

# Then run the migration file
\i prisma/migrations/20250101000000_add_user_authentication/migration.sql
```

## What the Migration Does

1. **Creates `users` table** with:
   - `id` (primary key)
   - `email` (unique)
   - `password` (hashed)
   - `name` (optional)
   - `createdAt` and `updatedAt` timestamps

2. **Adds `userId` columns** to:
   - `videos` (required)
   - `broll` (required)
   - `templates` (optional)
   - `voice_profiles` (required)

3. **Creates foreign key constraints** with CASCADE delete

4. **Migrates existing data**:
   - Creates a default migration user
   - Assigns all existing records to this user
   - Makes `userId` required for videos, broll, and voice_profiles

## Post-Migration Steps

1. **Verify Migration**:
   ```bash
   npx prisma migrate status
   ```

2. **Test Database Connection**:
   ```bash
   npx prisma db pull
   ```

3. **Create Your First User**:
   - Visit `/register` endpoint
   - Create an account with your email
   - All new content will be associated with your account

4. **Reassign Existing Data** (Optional):
   If you want to reassign existing videos/broll to your account:
   ```sql
   -- Get your user ID
   SELECT id FROM users WHERE email = 'your-email@example.com';
   
   -- Update existing records (replace YOUR_USER_ID)
   UPDATE videos SET "userId" = 'YOUR_USER_ID' WHERE "userId" = 'migration-default-user';
   UPDATE broll SET "userId" = 'YOUR_USER_ID' WHERE "userId" = 'migration-default-user';
   UPDATE voice_profiles SET "userId" = 'YOUR_USER_ID' WHERE "userId" = 'migration-default-user';
   ```

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Remove foreign key constraints
ALTER TABLE "videos" DROP CONSTRAINT IF EXISTS "videos_userId_fkey";
ALTER TABLE "broll" DROP CONSTRAINT IF EXISTS "broll_userId_fkey";
ALTER TABLE "templates" DROP CONSTRAINT IF EXISTS "templates_userId_fkey";
ALTER TABLE "voice_profiles" DROP CONSTRAINT IF EXISTS "voice_profiles_userId_fkey";

-- Remove userId columns
ALTER TABLE "videos" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "broll" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "templates" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "voice_profiles" DROP COLUMN IF EXISTS "userId";

-- Drop users table (WARNING: This deletes all user accounts!)
DROP TABLE IF EXISTS "users";
```

## Troubleshooting

### Error: "relation already exists"
The migration uses `IF NOT EXISTS` clauses, so it's safe to run multiple times.

### Error: "column already exists"
The migration checks for existing columns before adding them.

### Error: "constraint already exists"
The migration checks for existing constraints before adding them.

### Existing Data Without userId
The migration automatically creates a default user and assigns all existing records to it.

## Verification

After migration, verify:

```sql
-- Check users table exists
SELECT COUNT(*) FROM users;

-- Check userId columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'videos' AND column_name = 'userId';

-- Check foreign keys
SELECT conname FROM pg_constraint 
WHERE conname LIKE '%userId%';
```

## Support

If you encounter issues:
1. Check database connection: `npx prisma db pull`
2. Verify schema: `npx prisma migrate status`
3. Check logs for specific error messages
