"use node";

import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";

type KkiapayVerification = {
  status?: string;
  transactionId?: string;
  id?: string;
  amount?: number;
  message?: string;
};

export const verifyKkiapayAndSettle = action({
  args: {
    paymentRequestId: v.id("paymentRequests"),
    transactionId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    status: v.string(),
    providerReference: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Authentification requise.");

    const demoMode = process.env.KKIAPAY_DEMO_MODE === "true";
    const privateKey = process.env.KKIAPAY_PRIVATE_KEY;
    const baseUrl = process.env.KKIAPAY_BASE_URL ?? "https://api.kkiapay.me";

    let status: "success" | "failed" | "simulated_success" = "failed";
    let providerReference = args.transactionId;

    if (demoMode || !privateKey) {
      status = "simulated_success";
      providerReference = args.transactionId || `KK-DEMO-${Date.now().toString(36)}`;
    } else {
      const response = await fetch(`${baseUrl}/api/v1/transactions/${args.transactionId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${privateKey}`,
          "Content-Type": "application/json",
        },
      });
      const payload = (await response.json()) as KkiapayVerification;
      providerReference = payload.transactionId ?? payload.id ?? args.transactionId;
      status = response.ok && payload.status === "SUCCESS" ? "success" : "failed";
    }

    await ctx.runMutation(internal.payments.settleVerifiedPaymentInternal, {
      paymentRequestId: args.paymentRequestId,
      providerReference,
      status,
    });

    return {
      success: status !== "failed",
      status,
      providerReference,
    };
  },
});
