# R2 Upload Fix - Setup Instructions

## What was fixed:

1. **Authentication Issue**: The previous implementation used incorrect Basic authentication. R2 requires proper AWS S3 signature authentication.

2. **Security Issue**: API credentials were hardcoded in client-side code. Now they're properly secured in environment variables.

3. **"Load failed" Error**: This was caused by CORS issues and improper authentication. The new presigned URL approach bypasses these issues.

## Environment Variables Setup

Add these to your `.env.local` file (and your production environment):

```bash
# Cloudflare R2 Storage Configuration
CLOUDFLARE_R2_ACCOUNT_ID=aa2113b6e9c4e8181f42c2f7f46891f1
CLOUDFLARE_R2_ACCESS_KEY_ID=0f7d75c413cbf60bea1673ce243726fa
CLOUDFLARE_R2_SECRET_ACCESS_KEY=9daa02bc1fe9d843bc618bf0af78c81627a81499e7e4c1c11eea610bbe7b1d
CLOUDFLARE_R2_BUCKET_NAME=smart-content-videos
CLOUDFLARE_R2_PUBLIC_URL=https://pub-8b8b71f14a6347adbfbed072ddad9828.r2.dev
```

## How the new system works:

1. **Client requests presigned URL** from `/api/r2/presigned-url`
2. **Server generates secure presigned URL** using AWS SDK
3. **Client uploads directly to R2** using the presigned URL
4. **No credentials exposed** to the client-side code

## R2 Bucket CORS Configuration

Make sure your R2 bucket has the correct CORS policy:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Production Deployment

1. Add the environment variables to your Vercel project settings
2. Redeploy your application
3. The upload should now work without the "Load failed" error

## Testing

You can test the upload functionality:
1. Locally: Make sure `.env.local` has the correct variables
2. Production: Ensure environment variables are set in your deployment platform

The new system is more secure, reliable, and follows AWS S3 best practices for R2.
