import { getOrdersByUserId, getOrdersForAllUsers, Order } from "@/lib/orders";
import { demoUserStore } from "@/lib/demo-users";
import { Instructions } from "@/components/instructions";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function OrdersPage() {
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
          userId: sessionData.userId,
          firstName: sessionData.firstName,
          lastName: sessionData.lastName,
          email: sessionData.email,
        };
      }
    }
  } catch (e) {
    // Session parsing error
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }
  
  // Check if user is admin
  const demoUser = demoUserStore.getUserById(user.userId);
  const isAdmin = demoUser?.isAdmin || false;
  
  // Get orders - all orders for admin, user's orders for regular users
  const orders = isAdmin ? await getOrdersForAllUsers() : await getOrdersByUserId(user.userId);

  return (
    <div className="mx-auto max-w-[--breakpoint-2xl] px-4 py-10">
      <h1 className="mb-8 text-4xl font-medium">
        {isAdmin ? "All Orders (Admin)" : "Your Orders"}
      </h1>
      {orders.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <>
          <div>Place an order via your LLM.</div>
          <div>
            <Instructions openButtonLabel="Take my money!" />
          </div>
        </>
      )}
    </div>
  );
}

const OrderCard = ({ order }: { order: Order }) => {
  const fullName = [order.firstName, order.lastName]
    .filter((name) => name !== "UNKNOWN")
    .join(" ")
    .trim();

  const formattedDate = Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date(order.orderDate));

  return (
    <div className="flex flex-col rounded-lg border border-neutral-800 bg-black p-6 hover:border-purple-700 transition duration-200">
      <div className="mb-4 flex items-center justify-between border-b border-neutral-700 pb-4">
        <h2 className="font-medium text-white">Order Details</h2>
        <span className="rounded-full bg-purple-600 px-3 py-1 text-xs text-white">
          #{order.id}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-white/[60%]">Order date</span>
          <span className="text-white">{formattedDate} (UTC)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/[60%]">Name</span>
          <span className="text-white">{fullName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/[60%]">Email</span>
          <span className="text-white">
            <code>{order.email}</code>
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/[60%]">Company</span>
          <span className="text-white">{order.company}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/[60%]">T-shirt size</span>
          <span className="text-white">{order.tshirtSize}</span>
        </div>
      </div>
    </div>
  );
};
