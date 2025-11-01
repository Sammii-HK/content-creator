// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env' });
}