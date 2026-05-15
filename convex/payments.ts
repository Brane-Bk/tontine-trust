import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireCurrentUser, requireGroupMember } from "./lib/auth";

const transactionView = v.object({
  id: v.id("transactions"),
  name: v.string(),
  amount: v.number(),
  type: v.string(),
  status: v.string(),
  provider: v.string(),
  providerReference: v.optional(v.string()),
  createdAt: v.number(),
});

export const createContributionRequest = mutation({
  args: {
    groupId: v.id("groups"),
    roundId: v.id("rounds"),
    amount: v.number(),
    customerPhone: v.string(),
    operator: v.optional(v.string()),
  },
  returns: v.id("paymentRequests"),
  handler: async (ctx, args) => {
    const { user, member } = await requireGroupMember(ctx, args.groupId);
    if (member.status === "paid") {
      throw new ConvexError("Vous avez déjà cotisé pour ce tour.");
    }
    if (!args.customerPhone.trim()) {
      throw new ConvexError("Numéro Mobile Money requis.");
    }

    const round = await ctx.db.get(args.roundId);
    if (!round || round.groupId !== args.groupId) {
      throw new ConvexError("Tour de cotisation invalide.");
    }
    if (round.status !== "collecting" && round.status !== "blocked") {
      throw new ConvexError("Ce tour n'accepte plus de cotisations.");
    }

    const now = Date.now();
    return await ctx.db.insert("paymentRequests", {
      userId: user._id,
      groupId: args.groupId,
      roundId: args.roundId,
      amount: args.amount,
      type: "contribution",
      status: "pending",
      provider: "kkiapay",
      operator: args.operator,
      customerPhone: args.customerPhone.trim(),
      createdAt: now,
    });
  },
});

export const payContributionFromWallet = mutation({
  args: {
    groupId: v.id("groups"),
    roundId: v.id("rounds"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { user } = await requireGroupMember(ctx, args.groupId);
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new ConvexError("Groupe introuvable.");
    const total = group.contributionAmount + 20;
    if (user.walletBalance < total) {
      throw new ConvexError("Solde portefeuille insuffisant.");
    }

    await ctx.db.patch(user._id, {
      walletBalance: user.walletBalance - total,
      totalLocked: user.totalLocked + group.contributionAmount,
      score: Math.min(user.maxScore, user.score + 5),
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.tontines.markContributionPaidInternal, {
      groupId: args.groupId,
      roundId: args.roundId,
      userId: user._id,
      amount: group.contributionAmount,
      feeAmount: 20,
      provider: "wallet",
      providerReference: `WT-${Date.now().toString(36).toUpperCase()}`,
    });

    return true;
  },
});

export const createWalletDeposit = mutation({
  args: {
    amount: v.number(),
    customerPhone: v.string(),
    operator: v.optional(v.string()),
  },
  returns: v.object({
    paymentRequestId: v.id("paymentRequests"),
    settledInDemoMode: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    if (args.amount < 100) throw new ConvexError("Montant minimum : 100 FCFA.");

    const now = Date.now();
    const paymentRequestId = await ctx.db.insert("paymentRequests", {
      userId: user._id,
      amount: args.amount,
      type: "deposit",
      status: "pending",
      provider: "kkiapay",
      operator: args.operator,
      customerPhone: args.customerPhone.trim(),
      createdAt: now,
    });

    const providerReference = `KK-DEMO-${now.toString(36).toUpperCase()}`;
    await ctx.db.patch(paymentRequestId, {
      status: "simulated_success",
      providerReference,
      verifiedAt: now,
    });
    await ctx.db.patch(user._id, {
      walletBalance: user.walletBalance + args.amount,
      updatedAt: now,
    });
    await ctx.db.insert("transactions", {
      userId: user._id,
      type: "deposit",
      name: "Rechargement Portefeuille",
      amount: args.amount,
      status: "simulated_success",
      provider: "kkiapay",
      providerReference,
      customerPhone: args.customerPhone.trim(),
      createdAt: now,
    });

    return { paymentRequestId, settledInDemoMode: true };
  },
});

export const requestWithdrawal = mutation({
  args: {
    amount: v.number(),
    customerPhone: v.string(),
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    if (args.amount < 100) throw new ConvexError("Montant minimum : 100 FCFA.");
    if (user.walletBalance < args.amount) throw new ConvexError("Solde insuffisant.");

    const lateMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    if (lateMembership.some((membership) => membership.status === "late")) {
      throw new ConvexError("Compte suspendu : régularisez vos cotisations en retard.");
    }

    const now = Date.now();
    await ctx.db.patch(user._id, {
      walletBalance: user.walletBalance - args.amount,
      updatedAt: now,
    });

    return await ctx.db.insert("transactions", {
      userId: user._id,
      type: "withdrawal",
      name: "Retrait vers Mobile Money",
      amount: -Math.abs(args.amount),
      status: "simulated_success",
      provider: "system",
      customerPhone: args.customerPhone.trim(),
      createdAt: now,
    });
  },
});

export const walletAndTransactions = query({
  args: {},
  returns: v.object({
    walletBalance: v.number(),
    totalLocked: v.number(),
    hasLate: v.boolean(),
    transactions: v.array(transactionView),
  }),
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);

    return {
      walletBalance: user.walletBalance,
      totalLocked: user.totalLocked,
      hasLate: memberships.some((membership) => membership.status === "late"),
      transactions: transactions.map((transaction) => ({
        id: transaction._id,
        name: transaction.name,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        provider: transaction.provider,
        providerReference: transaction.providerReference,
        createdAt: transaction.createdAt,
      })),
    };
  },
});

export const settleVerifiedPaymentInternal = internalMutation({
  args: {
    paymentRequestId: v.id("paymentRequests"),
    providerReference: v.string(),
    status: v.union(
      v.literal("success"),
      v.literal("failed"),
      v.literal("simulated_success")
    ),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.paymentRequestId);
    if (!request) throw new ConvexError("Demande de paiement introuvable.");
    if (request.status === "success" || request.status === "simulated_success") {
      return true;
    }

    const now = Date.now();
    await ctx.db.patch(args.paymentRequestId, {
      status: args.status,
      providerReference: args.providerReference,
      verifiedAt: now,
    });

    if (args.status === "failed") {
      return false;
    }

    const user = await ctx.db.get(request.userId);
    if (!user) throw new ConvexError("Utilisateur introuvable.");

    if (request.type === "deposit") {
      await ctx.db.patch(user._id, {
        walletBalance: user.walletBalance + request.amount,
        updatedAt: now,
      });
      await ctx.db.insert("transactions", {
        userId: user._id,
        type: "deposit",
        name: "Rechargement Portefeuille",
        amount: request.amount,
        status: args.status,
        provider: "kkiapay",
        providerReference: args.providerReference,
        customerPhone: request.customerPhone,
        createdAt: now,
      });
      return true;
    }

    if (request.type === "contribution" && request.groupId && request.roundId) {
      await ctx.scheduler.runAfter(0, internal.tontines.markContributionPaidInternal, {
        groupId: request.groupId,
        roundId: request.roundId,
        userId: request.userId,
        amount: request.amount,
        feeAmount: 20,
        paymentRequestId: request._id,
        provider: "kkiapay",
        providerReference: args.providerReference,
      });
      return true;
    }

    return false;
  },
});
