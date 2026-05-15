import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { initialsFor, requireCurrentUser } from "./lib/auth";

const userSummary = v.object({
  id: v.id("users"),
  supabaseUserId: v.string(),
  email: v.string(),
  name: v.string(),
  initials: v.string(),
  phone: v.optional(v.string()),
  walletBalance: v.number(),
  totalLocked: v.number(),
  score: v.number(),
  maxScore: v.number(),
  groupsCount: v.number(),
  cyclesCompleted: v.number(),
});

export const syncCurrentUser = mutation({
  args: {
    supabaseUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentification requise.");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    const now = Date.now();
    const name = args.name?.trim() || args.email.split("@")[0] || "Utilisateur";
    const updates = {
      supabaseUserId: args.supabaseUserId,
      email: args.email,
      name,
      initials: initialsFor(name),
      phone: args.phone,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      ...updates,
      walletBalance: 0,
      totalLocked: 0,
      score: 500,
      maxScore: 1000,
      groupsCount: 0,
      cyclesCompleted: 0,
      createdAt: now,
    });
  },
});

export const me = query({
  args: {},
  returns: v.union(userSummary, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return null;
    }

    return {
      id: user._id,
      supabaseUserId: user.supabaseUserId,
      email: user.email,
      name: user.name,
      initials: user.initials,
      phone: user.phone,
      walletBalance: user.walletBalance,
      totalLocked: user.totalLocked,
      score: user.score,
      maxScore: user.maxScore,
      groupsCount: user.groupsCount,
      cyclesCompleted: user.cyclesCompleted,
    };
  },
});

export const updatePhone = mutation({
  args: { phone: v.string() },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    await ctx.db.patch(user._id, {
      phone: args.phone.trim(),
      updatedAt: Date.now(),
    });
    return user._id;
  },
});
