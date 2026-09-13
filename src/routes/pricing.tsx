import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/SiteLayout";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/payments.functions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "TypeFly Premium — Pricing" },
      {
        name: "description",
        content:
          "Unlock extra lessons, custom flights and progress history with TypeFly Premium. Test-mode checkout only.",
      },
      { property: "og:title", content: "TypeFly Premium — Pricing" },
      {
        property: "og:description",
        content: "Premium lessons, custom flights and full progress history.",
      },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    id: "monthly" as const,
    name: "Monthly Aviator",
    price: "₹199",
    note: "per month · cancel anytime",
    perks: [
      "Full library of beginner finger lessons",
      "Custom flight lengths (1m, 3m, 5m)",
      "Detailed career WPM & accuracy history",
      "Unlimited AI typing material generation",
    ],
  },
  {
    id: "yearly" as const,
    name: "Yearly SkyMaster",
    price: "₹1,499",
    note: "per year · save 37%",
    popular: true,
    perks: [
      "Everything in Monthly Aviator",
      "Early access to specialized code typing",
      "Special Aviator bird crown badges",
      "VIP cloud progress backup",
    ],
  },
];

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function PricingPage() {
  const createOrder = useServerFn(createRazorpayOrder);
  const verifyPayment = useServerFn(verifyRazorpayPayment);
  const { user } = useAuth();
  const [status, setStatus] = useState<{ message: string; isSuccess?: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Simulated Test Dialog state
  const [simulatedOrder, setSimulatedOrder] = useState<{
    orderId: string;
    plan: "monthly" | "yearly";
    amount: number;
    description: string;
  } | null>(null);

  async function handlePaymentCompletion(
    orderId: string,
    paymentId: string,
    signature?: string,
    isSimulated = false,
  ) {
    setStatus({ message: "Verifying payment with secure server..." });
    try {
      const verification = await verifyPayment({
        data: {
          orderId,
          paymentId,
          signature,
          isSimulated,
        },
      });

      if (verification.verified) {
        setStatus({
          message: `🎉 Success! ${verification.message} You are now a TypeFly Premium Aviator!`,
          isSuccess: true,
        });
        if (user) {
          await supabase.from("profiles").upsert({ id: user.id, is_premium: true });
        }
      } else {
        setStatus({
          message: `❌ Verification failed: ${verification.message}`,
          isSuccess: false,
        });
      }
    } catch {
      setStatus({
        message: "Payment verification encountered an unexpected error.",
        isSuccess: false,
      });
    }
  }

  async function startCheckout(plan: "monthly" | "yearly") {
    setStatus(null);
    setBusy(plan);
    try {
      const order = await createOrder({ data: { plan } });

      if (order.configured) {
        const ok = await loadRazorpayScript();
        if (!ok || !window.Razorpay) {
          // If script blocked by iframe or adblocker, fallback to sandbox test
          setSimulatedOrder({
            orderId: order.orderId,
            plan,
            amount: order.amount,
            description: order.description,
          });
          return;
        }

        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "TypeFly",
          description: `${order.description} (Test Mode)`,
          order_id: order.orderId,
          prefill: { email: user?.email ?? "pilot@example.com" },
          theme: { color: "#0284c7" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            await handlePaymentCompletion(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              false,
            );
          },
          modal: {
            ondismiss: () =>
              setStatus({ message: "Razorpay test checkout window was closed.", isSuccess: false }),
          },
        });
        rzp.open();
      } else {
        // Safe sandbox test mode
        setSimulatedOrder({
          orderId: order.orderId,
          plan,
          amount: order.amount,
          description: order.description,
        });
      }
    } catch {
      setStatus({
        message: "Something went wrong initiating test checkout. Please try again.",
        isSuccess: false,
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="text-center sm:text-left">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">TypeFly Premium</h1>
          <p className="mt-1 text-muted-foreground">
            TypeFly is free to play forever. Premium unlocks extended flight durations, AI passage
            generations, and lifetime career tracking.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent/60 px-3.5 py-1 text-xs font-bold text-accent-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Razorpay Test Mode Active — Safe sandbox checkout
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`panel relative flex flex-col justify-between p-6 ${
                p.popular ? "border-primary shadow-lg ring-1 ring-primary/20" : ""
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-0.5 text-xs font-extrabold text-primary-foreground">
                  MOST POPULAR
                </span>
              )}
              <div>
                <h2 className="font-display text-xl font-extrabold">{p.name}</h2>
                <p className="mt-2 font-display text-4xl font-extrabold text-primary">{p.price}</p>
                <p className="text-xs text-muted-foreground">{p.note}</p>
                <ul className="mt-6 space-y-2 text-sm">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => startCheckout(p.id)}
                  disabled={busy === p.id}
                  className={
                    p.popular ? "btn-primary w-full" : "btn-ghost w-full border border-border"
                  }
                >
                  {busy === p.id ? "Preparing checkout…" : "Test Checkout with Razorpay"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {status && (
          <div
            className={`mt-6 rounded-2xl p-4 text-sm font-bold transition-all ${
              status.isSuccess
                ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border border-green-300 dark:border-green-800"
                : "bg-muted text-foreground border border-border"
            }`}
          >
            {status.message}
            {status.isSuccess && (
              <div className="mt-2">
                <Link to="/profile" className="btn-primary text-xs">
                  Go to Profile & Stats →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Simulated Sandbox Modal when Razorpay test keys are simulated or iframe blocks popup */}
        {simulatedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="panel max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                💳
              </div>
              <h3 className="mt-3 font-display text-xl font-bold">Razorpay Test Checkout</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Order ID: <code className="font-mono">{simulatedOrder.orderId}</code>
              </p>
              <div className="my-4 rounded-xl bg-muted/60 p-3 text-left text-xs space-y-1">
                <p>
                  <strong className="text-foreground">Plan:</strong> {simulatedOrder.description}
                </p>
                <p>
                  <strong className="text-foreground">Amount:</strong> ₹
                  {(simulatedOrder.amount / 100).toFixed(2)} INR
                </p>
                <p>
                  <strong className="text-foreground">Environment:</strong> Safe Razorpay Sandbox
                </p>
                <p className="text-muted-foreground pt-1 text-[11px]">
                  No real card will be charged. This verifies the order creation, signature check,
                  and profile upgrade.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const fakePaymentId = `pay_test_${Date.now()}`;
                    setSimulatedOrder(null);
                    void handlePaymentCompletion(
                      simulatedOrder.orderId,
                      fakePaymentId,
                      "simulated_sig",
                      true,
                    );
                  }}
                  className="btn-primary flex-1 text-xs"
                >
                  Simulate Successful Payment ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimulatedOrder(null);
                    setStatus({ message: "Test payment was cancelled.", isSuccess: false });
                  }}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {!user && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Want your subscription saved across devices?{" "}
            <Link to="/auth" className="font-bold underline text-foreground">
              Sign in or create a free account
            </Link>{" "}
            first.
          </p>
        )}

        {/* Legal & Compliance Footer */}
        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Legal & Compliance</p>
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            <Link to="/legal/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link to="/legal/terms" className="hover:underline">
              Terms of Service
            </Link>
            <Link to="/legal/refund" className="hover:underline">
              Refund Policy
            </Link>
            <Link to="/legal/contact" className="hover:underline">
              Contact Us
            </Link>
          </div>
          <p className="mt-2 text-[11px]">
            Payments in test mode simulate Razorpay UPI, Netbanking, and Cards without billing.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
