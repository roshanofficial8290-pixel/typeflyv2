import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "node:crypto";

const inputSchema = z.object({
  plan: z.enum(["monthly", "yearly"]),
});

const verifySchema = z.object({
  orderId: z.string(),
  paymentId: z.string(),
  signature: z.string().optional(),
  isSimulated: z.boolean().optional(),
});

const PLANS = {
  monthly: { amount: 19900, label: "TypeFly Premium — monthly", priceDisplay: "₹199" },
  yearly: { amount: 149900, label: "TypeFly Premium — yearly", priceDisplay: "₹1,499" },
} as const;

export type OrderResult =
  | {
      configured: false;
      isSimulated: true;
      orderId: string;
      amount: number;
      currency: string;
      description: string;
      note: string;
    }
  | {
      configured: true;
      keyId: string;
      orderId: string;
      amount: number;
      currency: string;
      description: string;
    };

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<OrderResult> => {
    const keyId = process.env["RAZORPAY_TEST_KEY_ID"];
    const keySecret = process.env["RAZORPAY_TEST_KEY_SECRET"];
    const plan = PLANS[data.plan];

    // If Razorpay keys are not provided in the environment, provide safe sandbox test order
    if (!keyId || !keySecret || !keyId.startsWith("rzp_test")) {
      const simulatedOrderId = `order_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      return {
        configured: false,
        isSimulated: true,
        orderId: simulatedOrderId,
        amount: plan.amount,
        currency: "INR",
        description: plan.label,
        note: "Razorpay keys not set or in sandbox. Running in safe TypeFly test sandbox.",
      };
    }

    try {
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        },
        body: JSON.stringify({
          amount: plan.amount,
          currency: "INR",
          receipt: `typefly_${Date.now()}`,
          notes: { plan: data.plan, mode: "test" },
        }),
      });

      if (!response.ok) {
        // Fallback to safe sandbox if Razorpay API rejected test credentials
        return {
          configured: false,
          isSimulated: true,
          orderId: `order_test_${Date.now()}`,
          amount: plan.amount,
          currency: "INR",
          description: plan.label,
          note: "Razorpay test API response failed; falling back to sandbox simulator.",
        };
      }

      const order = (await response.json()) as { id: string; amount: number; currency: string };
      return {
        configured: true,
        keyId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        description: plan.label,
      };
    } catch {
      return {
        configured: false,
        isSimulated: true,
        orderId: `order_test_${Date.now()}`,
        amount: plan.amount,
        currency: "INR",
        description: plan.label,
        note: "Network error connecting to Razorpay; safe sandbox enabled.",
      };
    }
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verifySchema.parse(data))
  .handler(async ({ data }): Promise<{ verified: boolean; message: string }> => {
    const keySecret = process.env["RAZORPAY_TEST_KEY_SECRET"];

    if (data.isSimulated || !keySecret) {
      return {
        verified: true,
        message: "Test payment verified successfully via TypeFly sandbox.",
      };
    }

    if (!data.signature) {
      return { verified: false, message: "Missing Razorpay signature verification data." };
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${data.orderId}|${data.paymentId}`)
      .digest("hex");

    if (expectedSignature === data.signature) {
      return {
        verified: true,
        message: "Razorpay signature verified successfully in test mode.",
      };
    }

    return {
      verified: false,
      message: "Payment signature mismatch. Verification failed.",
    };
  });
