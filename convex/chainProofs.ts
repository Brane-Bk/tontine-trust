import { ConvexError, v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { requireGroupMember } from "./lib/auth";

export const listForGroup = query({
  args: { groupId: v.id("groups") },
  returns: v.array(
    v.object({
      id: v.id("chainProofs"),
      type: v.string(),
      payloadHash: v.string(),
      txHash: v.optional(v.string()),
      contractAddress: v.optional(v.string()),
      chainId: v.optional(v.number()),
      status: v.string(),
      createdAt: v.number(),
      anchoredAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    await requireGroupMember(ctx, args.groupId);
    const proofs = await ctx.db
      .query("chainProofs")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    return proofs
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((proof) => ({
        id: proof._id,
        type: proof.type,
        payloadHash: proof.payloadHash,
        txHash: proof.txHash,
        contractAddress: proof.contractAddress,
        chainId: proof.chainId,
        status: proof.status,
        createdAt: proof.createdAt,
        anchoredAt: proof.anchoredAt,
      }));
  },
});

export const markAnchoredInternal = internalMutation({
  args: {
    proofId: v.id("chainProofs"),
    txHash: v.string(),
    contractAddress: v.string(),
    chainId: v.number(),
    simulated: v.boolean(),
  },
  returns: v.id("chainProofs"),
  handler: async (ctx, args) => {
    const proof = await ctx.db.get(args.proofId);
    if (!proof) throw new ConvexError("Preuve blockchain introuvable.");

    await ctx.db.patch(args.proofId, {
      txHash: args.txHash,
      contractAddress: args.contractAddress,
      chainId: args.chainId,
      status: args.simulated ? "simulated" : "anchored",
      anchoredAt: Date.now(),
    });

    return args.proofId;
  },
});
