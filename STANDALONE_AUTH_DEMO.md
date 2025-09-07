# Standalone MCP OAuth Demo

This demo shows how to integrate AuthKit's Standalone Connect with a custom username/password authentication system for MCP servers.

## Overview

The Standalone Connect flow works as follows:

1. **MCP clients** initiate OAuth with AuthKit as the authorization server
2. **AuthKit redirects** users to your custom login page (`/standalone-login`) 
3. **Your application** authenticates users with username/password
4. **Your application** calls AuthKit's completion API to finish OAuth
5. **AuthKit** issues tokens and returns control to the MCP client
6. **MCP server** verifies tokens and resolves users from local store

## Demo Components

### Authentication System
- **`lib/demo-users.ts`** - Simple in-memory user store with demo accounts
- **`app/standalone-login/page.tsx`** - Custom login page that handles `external_auth_id`
- **`app/api/auth/standalone-login/route.ts`** - API endpoint that calls AuthKit completion

### MCP Integration  
- **`lib/with-authkit-standalone.ts`** - Modified AuthKit middleware for standalone auth
- **`app/standalone-mcp/route.ts`** - MCP server route using standalone authentication
- **`app/.well-known/oauth-protected-resource/route.ts`** - OAuth metadata for MCP discovery
- **`app/.well-known/oauth-authorization-server/route.ts`** - Compatibility proxy for older clients

## Demo Users

The following demo accounts are available:

| Username | Password | Name |
|----------|----------|------|
| `demo` | `password123` | Demo User |
| `alice` | `alice123` | Alice Smith |
| `bob` | `bob123` | Bob Johnson |

## Configuration Required

To use this demo, you need to configure Standalone Connect in WorkOS:

1. **Enable Dynamic Client Registration** in WorkOS Dashboard under Applications → Configuration
2. **Set Login URI** to `https://your-domain.com/standalone-login` in your WorkOS application settings
3. **Environment Variables**:
   ```env
   AUTHKIT_DOMAIN=your-subdomain.authkit.app
   WORKOS_CLIENT_ID=your_client_id
   WORKOS_CLIENT_SECRET=your_client_secret
   ```

## Testing the Demo

### 1. Connect MCP Client

Configure your MCP client to connect to the standalone endpoint:

```json
{
  "mcpServers": {
    "mcp-shop-standalone": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch", "https://your-domain.com/standalone-mcp"]
    }
  }
}
```

### 2. Authentication Flow

1. MCP client will detect the server requires authentication
2. You'll be redirected to the custom login page at `/standalone-login`
3. Enter demo credentials (e.g., username: `demo`, password: `password123`)
4. After successful login, you'll be redirected back to the MCP client
5. The client will now have access to the MCP tools

### 3. Available Tools

The standalone MCP server provides these tools:

- **`listMcpShopInventory`** - View available products
- **`buyMcpShopItem`** - Place an order for a t-shirt
- **`listMcpShopOrders`** - View your order history  
- **`getAuthenticatedUser`** - See current user info (demonstrates custom auth)

## Key Differences from Standard AuthKit

1. **User Resolution**: Instead of fetching users from WorkOS, we resolve them from our local `demoUserStore`
2. **Custom Login**: Users authenticate via our username/password form, not AuthKit's hosted UI
3. **Completion API**: We call AuthKit's `/oauth2/complete` endpoint to finish the OAuth flow
4. **Token Claims**: The JWT subject claim contains our local user ID, not a WorkOS user ID

## Production Considerations

For production use, you would:

1. **Replace the demo user store** with your actual user database
2. **Hash passwords** using bcrypt or similar
3. **Add proper error handling** and logging
4. **Implement session management** if needed
5. **Add rate limiting** to prevent brute force attacks
6. **Use HTTPS** for all authentication endpoints
7. **Validate and sanitize** all user inputs

## Architecture Benefits

This approach allows you to:

- **Maintain existing authentication** while adding MCP support
- **Keep user data in your system** rather than migrating to WorkOS
- **Customize the login experience** to match your application
- **Leverage AuthKit's OAuth infrastructure** without changing your auth stack
- **Support MCP clients** with zero configuration required
