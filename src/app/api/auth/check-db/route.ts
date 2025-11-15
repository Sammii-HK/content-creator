import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await db.$connect();
    
    // Try to query users table
    try {
      await db.user.findMany({ take: 1 });
      return NextResponse.json({
        success: true,
        message: 'Database is ready',
        tablesExist: true,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('table')) {
        return NextResponse.json({
          success: false,
          message: 'Users table does not exist. Please run: npx prisma migrate deploy',
          tablesExist: false,
          error: errorMessage,
        }, { status: 503 });
      }
      
      throw error;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    console.error('Database check failed:', errorMessage);
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: errorMessage,
    }, { status: 503 });
  }
}
