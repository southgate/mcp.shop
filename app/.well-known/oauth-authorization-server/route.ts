import { NextResponse } from 'next/server';

/**
 * OAuth 2.0 Authorization Server Metadata Proxy Endpoint
 * 
 * Some MCP clients may not support OAuth 2.0 Protected Resource Metadata
 * and instead attempt to fetch authorization server metadata directly
 * from the MCP server. This endpoint proxies AuthKit's metadata for
 * compatibility with those clients.
 */
export async function GET() {
  const authkitDomain = process.env.AUTHKIT_DOMAIN;

  if (!authkitDomain) {
    return NextResponse.json(
      { error: 'AUTHKIT_DOMAIN not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://${authkitDomain}/.well-known/oauth-authorization-server`,
      {
        // Add cache headers to avoid hitting AuthKit too frequently
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`AuthKit metadata fetch failed: ${response.status}`);
    }

    const metadata = await response.json();
    return NextResponse.json(metadata);

  } catch (error) {
    console.error('Error fetching AuthKit metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch authorization server metadata' },
      { status: 500 }
    );
  }
}