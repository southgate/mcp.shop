import { NextRequest, NextResponse } from 'next/server';
import { demoUsers } from '@/lib/demo-users';

/**
 * General Login API for Main App
 * 
 * This endpoint handles username/password authentication for the main application.
 * For simplicity, it creates a simple session token instead of using WorkOS sessions.
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Authenticate user against demo users
    const user = demoUsers.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create a simple session token (in production, use proper JWT or secure tokens)
    const sessionData = {
      userId: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    };

    // Set the session cookie
    const response = NextResponse.json({ success: true });
    
    response.cookies.set('demo-session', JSON.stringify(sessionData), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}