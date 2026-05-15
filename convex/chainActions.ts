"use node";

import crypto from "crypto";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";

function simulatedTxHash(seed: string): string {
  return `0x${crypto.createHash("sha256").update(seed).digest("hex")}`;
}

export const anchorPendingProof = action({
  args: { proofId: v.id("chainProofs") },
  returns: v.object({
    txHash: v.string(),
    simulated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Authentification requise.");

    const chainId = Number(process.env.TONTINECHAIN_CHAIN_ID ?? "44787");
    const contractAddress =
      process.env.TONTINECHAIN_CONTRACT_ADDRESS ??
      "0x0000000000000000000000000000000000002026";

    // For the hackathon MVP, anchoring can run in demo mode without an RPC key.
    // The smart contract source is included in `contracts/TontineChainProof.sol`.
    const txHash = simulatedTxHash(
      `${args.proofId}:${contractAddress}:${chainId}:${Date.now()}`
    );

    await ctx.runMutation(internal.chainProofs.markAnchoredInternal, {
      proofId: args.proofId,
      txHash,
      contractAddress,
      chainId,
      simulated: true,
    });

    return { txHash, simulated: true };
  },
});

export const anchorProofInternal = internalAction({
  args: { proofId: v.id("chainProofs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chainId = Number(process.env.TONTINECHAIN_CHAIN_ID ?? "44787");
    const contractAddress =
      process.env.TONTINECHAIN_CONTRACT_ADDRESS ??
      "0x0000000000000000000000000000000000002026";
    const txHash = simulatedTxHash(
      `${args.proofId}:${contractAddress}:${chainId}:${Date.now()}`
    );

    await ctx.runMutation(internal.chainProofs.markAnchoredInternal, {
      proofId: args.proofId,
      txHash,
      contractAddress,
      chainId,
      simulated: true,
    });

    return null;
  },
});
