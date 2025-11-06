import { NextRequest, NextResponse } from 'next/server';
import { succulentService } from '@/lib/succulent-integration';
import { db } from '@/lib/db';

// Get connected Succulent accounts
export async function GET(request: NextRequest) {
  try {
    console.log('📱 Fetching Succulent accounts...');

    const accounts = await succulentService.getConnectedAccounts();

    // Get connected personas for each account
    const accountsWithPersonas = await Promise.all(
      accounts.map(async (account) => {
        // Check if this account has a connected persona
        const persona = await db.voiceProfile.findFirst({
          where: { 
            niche: account.platform,
            isActive: true 
          }
        });

        return {
          ...account,
          connectedPersona: persona ? {
            id: persona.id,
            name: persona.name,
            niche: persona.niche
          } : null
        };
      })
    );

    return NextResponse.json({
      success: true,
      accounts: accountsWithPersonas,
      totalAccounts: accounts.length,
      connectedPersonas: accountsWithPersonas.filter(a => a.connectedPersona).length
    });

  } catch (error) {
    console.error('❌ Failed to fetch Succulent accounts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch accounts',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Check Succulent API key and connection'
      },
      { status: 500 }
    );
  }
}

// Connect account to persona
export async function POST(request: NextRequest) {
  try {
    const { accountId, personaId } = await request.json();

    if (!accountId || !personaId) {
      return NextResponse.json(
        { error: 'accountId and personaId are required' },
        { status: 400 }
      );
    }

    console.log('🔗 Connecting account to persona:', { accountId, personaId });

    // Verify persona exists
    const persona = await db.voiceProfile.findUnique({
      where: { id: personaId }
    });

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    // Store the connection (you might want a separate table for this)
    // For now, we'll use the persona's niche to match with account platform
    
    return NextResponse.json({
      success: true,
      message: `Account ${accountId} connected to persona ${persona.name}`,
      connection: {
        accountId,
        personaId,
        personaName: persona.name,
        niche: persona.niche
      }
    });

  } catch (error) {
    console.error('❌ Failed to connect account:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
