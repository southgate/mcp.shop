import { NextRequest, NextResponse } from 'next/server';
import { demoUserStore } from '@/lib/demo-users';

/**
 * Standalone Login API Endpoint
 * 
 * This endpoint handles the authentication step in Standalone Connect:
 * 1. Validates username/password against our demo user store
 * 2. Calls AuthKit's completion API to finish the OAuth flow
 * 3. Returns the redirect URL back to the MCP client
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password, external_auth_id } = await request.json();

    if (!username || !password || !external_auth_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Authenticate user with our demo system
    const user = demoUserStore.authenticate(username, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Call WorkOS API to finish the OAuth flow
    const apiHostname = process.env.WORKOS_API_HOSTNAME || 'api.workos.com';
    const apiKey = process.env.WORKOS_API_KEY;

    if (!apiKey) {
      console.error('Missing required environment variables for WorkOS API');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Complete the OAuth flow with WorkOS
    const completionResponse = await fetch(
      `https://${apiHostname}/authkit/oauth2/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          external_auth_id,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
          },
        }),
      }
    );

    if (!completionResponse.ok) {
      const errorData = await completionResponse.text();
      console.error('AuthKit completion failed:', errorData);
      return NextResponse.json(
        { error: 'Authentication completion failed' },
        { status: 500 }
      );
    }

    const completionData = await completionResponse.json();

    return NextResponse.json({
      success: true,
      redirect_url: completionData.redirect_uri,
    });

  } catch (error) {
    console.error('Standalone login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
