#!/bin/bash

# Production Database Migration Script
# This script runs the user authentication migration for production

set -e

echo "🚀 Starting production database migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it before running migrations:"
    echo "export DATABASE_URL='your-production-database-url'"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run migration
echo "🔄 Running migration: add_user_authentication..."
npx prisma migrate deploy

echo "✅ Migration completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Verify the migration was applied: npx prisma migrate status"
echo "2. Test authentication endpoints"
echo "3. Create your first user account via /register"
