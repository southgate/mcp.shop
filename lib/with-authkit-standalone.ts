import { NextRequest } from "next/server";
import * as jose from "jose";
import { demoUserStore, type DemoUser } from "./demo-users";

export interface StandaloneAuthorization {
  user: DemoUser;
  accessToken: string;
  claims: {
    iss: string;
    aud: string;
    sub: string;
    sid: string;
    jti: string;
  };
}

/**
 * Standalone AuthKit middleware for MCP server endpoints
 * 
 * This version works with Standalone Connect where:
 * 1. Users authenticate with our custom username/password system
 * 2. AuthKit handles OAuth authorization and token issuance
 * 3. We verify tokens and map the user ID back to our user store
 * 
 * The key difference from regular AuthKit is that we resolve users
 * from our own user store rather than WorkOS user management.
 */
export function withAuthkitStandalone(
  next: (request: NextRequest, auth: StandaloneAuthorization) => Promise<Response>,
): (request: NextRequest) => Promise<Response> {
  const authkitDomain = process.env.AUTHKIT_DOMAIN;

  if (!authkitDomain) {
    throw new Error("AUTHKIT_DOMAIN is not set");
  }

  // Create a JWKS client to fetch and cache AuthKit's public keys
  const jwks = jose.createRemoteJWKSet(
    new URL(`https://${authkitDomain}/oauth2/jwks`),
  );

  const mcpServerDomain =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? "localhost:3000";
  const protocol = mcpServerDomain.startsWith("localhost") ? "http" : "https";

  return async (request: NextRequest) => {
    let resource: string;
    switch (request.nextUrl.pathname) {
      case "/mcp":
      case "/sse":
        resource = request.nextUrl.pathname;
        break;
      default:
        resource = "";
    }

    // WWW-Authenticate header for MCP client discovery
    const wwwAuthenticateHeader = [
      'Bearer error="unauthorized"',
      'error_description="Authorization needed"',
      `resource_metadata="${protocol}://${mcpServerDomain}/.well-known/oauth-protected-resource${resource}"`,
    ].join(", ");

    const unauthorized = (error: string) =>
      new Response(JSON.stringify({ error }), {
        status: 401,
        headers: {
          "WWW-Authenticate": wwwAuthenticateHeader,
          "Content-Type": "application/json",
        },
      });

    // Extract Bearer token from Authorization header
    const authorizationHeader = request.headers.get("Authorization");
    if (!authorizationHeader) {
      return unauthorized("Missing Authorization Header");
    }

    const [scheme = "", token] = authorizationHeader.split(" ");
    if (!/^Bearer$/i.test(scheme) || !token) {
      return unauthorized("Invalid Authorization Header");
    }

    let payload: StandaloneAuthorization["claims"];
    try {
      // Verify the JWT access token issued by AuthKit
      ({ payload } = await jose.jwtVerify(token, jwks, {
        audience: process.env.WORKOS_CLIENT_ID,
        issuer: `https://${authkitDomain}`,
      }));
    } catch (error) {
      if (
        error instanceof jose.errors.JWTExpired ||
        error instanceof jose.errors.JWKSInvalid
      ) {
        return unauthorized("Invalid or expired access token");
      }

      if (error instanceof jose.errors.JOSEError) {
        console.error("Error initializing JWKS", { error });
        return new Response("Internal server error", { status: 500 });
      }

      throw error;
    }

    // In Standalone Connect, the subject claim contains our user ID
    // We resolve the user from our own user store instead of WorkOS
    const user = demoUserStore.getUserById(payload.sub);
    if (!user) {
      return unauthorized("User not found in local store");
    }

    // Pass the authenticated user context to the protected handler
    return next(request, { user, accessToken: token, claims: payload });
  };
}
