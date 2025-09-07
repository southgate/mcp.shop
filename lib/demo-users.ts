/**
 * Demo user store for Standalone MCP OAuth implementation
 * In production, this would be replaced with your actual user database
 */

export interface DemoUser {
  id: string;
  username: string;
  password: string; // In production, this would be hashed
  email: string;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
}

// Demo users for testing
export const demoUsers: DemoUser[] = [
  {
    id: "user_01",
    username: "demo",
    password: "password123", // In production: hash this!
    email: "demo@mcp.shop",
    firstName: "Demo",
    lastName: "User",
  },
  {
    id: "user_02", 
    username: "alice",
    password: "alice123",
    email: "alice@mcp.shop",
    firstName: "Alice",
    lastName: "Smith",
  },
  {
    id: "user_03",
    username: "bob",
    password: "bob123", 
    email: "bob@mcp.shop",
    firstName: "Bob",
    lastName: "Johnson",
  },
  {
    id: "admin_01",
    username: "admin",
    password: "admin123",
    email: "admin@mcp.shop",
    firstName: "Admin",
    lastName: "User",
    isAdmin: true,
  },
];

export class DemoUserStore {
  private users: Map<string, DemoUser>;

  constructor() {
    this.users = new Map();
    demoUsers.forEach(user => {
      this.users.set(user.username, user);
    });
  }

  /**
   * Authenticate a user with username/password
   * In production, you'd hash the password and compare hashes
   */
  authenticate(username: string, password: string): DemoUser | null {
    const user = this.users.get(username);
    if (user && user.password === password) {
      return user;
    }
    return null;
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): DemoUser | null {
    for (const user of this.users.values()) {
      if (user.id === id) {
        return user;
      }
    }
    return null;
  }

  /**
   * Get user by username
   */
  getUserByUsername(username: string): DemoUser | null {
    return this.users.get(username) || null;
  }
}

// Singleton instance
export const demoUserStore = new DemoUserStore();
