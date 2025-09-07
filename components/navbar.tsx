import Link from "next/link";
import Image from "next/image";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { cookies } from 'next/headers';

export async function Navbar() {
  // Check for demo session
  let user = null;
  
  try {
    const cookieStore = await cookies();
    const demoSession = cookieStore.get('demo-session');
    
    if (demoSession) {
      const sessionData = JSON.parse(demoSession.value);
      
      // Check if session is not expired
      if (!sessionData.exp || Date.now() < sessionData.exp) {
        user = {
          firstName: sessionData.firstName,
          email: sessionData.email,
        };
      }
    }
  } catch (e) {
    // Session parsing error, user remains null
  }

  return (
    <nav className="flex items-center justify-between p-4 text-neutral-400">
      <Link className="flex" href="/">
        <Image alt="MCP Shop logo" src="/logo.png" height={40} width={40} />
        <div className="flex w-full items-center font-bold text-lg pl-1">
          mcp.shop
        </div>
      </Link>
      <div>
        {user ? (
          <div className="flex gap-2 items-center min-w-0">
            <Link className="flex gap-2 items-center" href="/orders">
              <ShoppingCartIcon className="h-5 border rounded m-1 text-foreground" />
              <div className="hidden lg:block whitespace-nowrap">
                Welcome back, {user.firstName ?? user.email}.
              </div>
            </Link>
            <form
              className="inline"
              action={async () => {
                "use server";
                const { cookies } = await import('next/headers');
                const cookieStore = await cookies();
                cookieStore.delete('demo-session');
              }}
            >
              <button className="underline" type="submit">
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <Link href="/login">Sign in</Link>
        )}
      </div>
    </nav>
  );
}
