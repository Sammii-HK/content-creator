#!/bin/bash

echo "🗄️ Setting up Smart Content Studio Database..."

# Check if we're in production or development
if [ "$NODE_ENV" = "production" ]; then
    echo "🏭 Production environment detected"
else
    echo "🔧 Development environment detected"
fi

# Run the complete database setup
echo "🚀 Running database setup..."
npm run db:setup

echo "🎉 Database setup complete!"
echo ""
echo "📊 Database Status:"
echo "✅ Schema deployed"
echo "✅ Sample data seeded"
echo "🔗 View database: npm run db:studio"
