# Quick Fix Guide - Login/Register Not Working

## Step 1: Run Database Migration

The most common issue is that the database tables don't exist yet. Run:

```bash
# Set your DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Generate Prisma Client
npx prisma generate

# Run migration
npx prisma migrate deploy
```

## Step 2: Check Database Connection

Visit: `http://localhost:3000/api/auth/check-db`

This will tell you if:
- Database is connected ✅
- Tables exist ✅
- What error you're getting ❌

## Step 3: Set JWT_SECRET

Add to your `.env` file:
```bash
JWT_SECRET=your-secure-random-secret-key-min-32-chars
```

Generate one:
```bash
openssl rand -base64 32
```

## Step 4: Test Registration

1. Go to `/register`
2. Fill in email and password (min 6 chars)
3. Check browser console (F12) for errors
4. Check Network tab to see API response

## Common Errors & Fixes

### Error: "Database tables not found"
**Fix**: Run `npx prisma migrate deploy`

### Error: "Database connection failed"
**Fix**: Check `DATABASE_URL` is set correctly

### Error: "Invalid email or password" (on login)
**Fix**: Make sure you registered first, or check password is correct

### Error: "User with this email already exists"
**Fix**: Use a different email or login instead

### Cookies not being set
**Fix**: 
- Make sure you're on same domain (not localhost:3000 vs 127.0.0.1:3000)
- Check browser allows cookies
- In production, ensure HTTPS

## Debug Steps

1. **Check API endpoint directly**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

2. **Check browser console** for JavaScript errors

3. **Check Network tab** in DevTools to see API responses

4. **Check server logs** for database errors

## Still Not Working?

1. Check `DATABASE_URL` is correct
2. Verify migration ran successfully: `npx prisma migrate status`
3. Check Prisma Client is generated: `ls node_modules/.prisma/client`
4. Restart your dev server: `npm run dev`
