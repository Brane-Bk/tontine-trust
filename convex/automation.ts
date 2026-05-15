import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation } from "./_generated/server";

const frequencyMs: Record<string, number> = {
  Journalier: 24 * 60 * 60 * 1000,
  Hebdomadaire: 7 * 24 * 60 * 60 * 1000,
  Bimensuelle: 15 * 24 * 60 * 60 * 1000,
  Mensuelle: 30 * 24 * 60 * 60 * 1000,
  Trimestrielle: 90 * 24 * 60 * 60 * 1000,
};

export const processDeadlines = internalMutation({
  args: {},
  returns: v.object({
    lateMembers: v.number(),
    finalizedRounds: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const activeGroups = await ctx.db
      .query("groups")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let lateMembers = 0;
    let finalizedRounds = 0;

    for (const group of activeGroups) {
      if (group.contributionDeadlineAt && group.contributionDeadlineAt <= now) {
        const members = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect();

        for (const member of members) {
          if (member.status === "waiting") {
            await ctx.db.patch(member._id, {
              status: "late",
              incidentStatus: "late",
            });
            lateMembers += 1;
            await ctx.db.insert("notifications", {
              userId: member.userId,
              groupId: group._id,
              title: "Cotisation en retard",
              message: `Votre cotisation pour ${group.name} est en retard. Le retrait portefeuille est suspendu jusqu'à régularisation.`,
              type: "late",
              read: false,
              color: "red",
              navigateTo: "/cotiser",
              createdAt: now,
            });
          }
        }
      }

      const finalized = await finalizeGroupRound(ctx, group._id);
      finalizedRounds += finalized ? 1 : 0;
    }

    return { lateMembers, finalizedRounds };
  },
});

export const finalizeReadyRounds = internalMutation({
  args: { groupId: v.id("groups") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return await finalizeGroupRound(ctx, args.groupId);
  },
});

async function finalizeGroupRound(ctx: MutationCtx, groupId: Id<"groups">) {
  const group = await ctx.db.get(groupId);
  if (!group || group.status !== "active" || group.currentRound <= 0) return false;

  const round = await ctx.db
    .query("rounds")
    .withIndex("by_group_and_round", (q) =>
      q.eq("groupId", group._id).eq("roundNumber", group.currentRound)
    )
    .unique();
  if (!round || round.status === "paid_out") return false;

  const members = await ctx.db
    .query("groupMembers")
    .withIndex("by_group", (q) => q.eq("groupId", group._id))
    .collect();
  const expectedPayers = members.filter(
    (member) => member.status !== "excluded" && member.status !== "deceased"
  );
  const contributions = await ctx.db
    .query("contributions")
    .withIndex("by_round", (q) => q.eq("roundId", round._id))
    .collect();
  const paidUserIds = new Set(
    contributions
      .filter((contribution) =>
        ["success", "simulated_success", "wallet_transfer"].includes(contribution.status)
      )
      .map((contribution) => contribution.userId)
  );
  const allPaid = expectedPayers.every((member) => paidUserIds.has(member.userId));
  if (!allPaid) return false;

  const beneficiary = members.find((member) => member.turnOrder === group.currentRound);
  if (!beneficiary) {
    throw new ConvexError("Bénéficiaire introuvable pour le tour actuel.");
  }

  const now = Date.now();
  const payoutAmount = group.contributionAmount * expectedPayers.length;
  const beneficiaryUser = await ctx.db.get(beneficiary.userId);
  if (!beneficiaryUser) throw new ConvexError("Utilisateur bénéficiaire introuvable.");

  await ctx.db.patch(beneficiary.userId, {
    walletBalance: beneficiaryUser.walletBalance + payoutAmount,
    totalLocked: Math.max(0, beneficiaryUser.totalLocked - payoutAmount),
    cyclesCompleted: beneficiaryUser.cyclesCompleted + 1,
    updatedAt: now,
  });
  await ctx.db.insert("transactions", {
    userId: beneficiary.userId,
    groupId: group._id,
    roundId: round._id,
    type: "payout",
    name: `Cagnotte reçue — ${group.name}`,
    amount: payoutAmount,
    status: "success",
    provider: "system",
    createdAt: now,
  });

  const proofId = await ctx.db.insert("chainProofs", {
    groupId: group._id,
    userId: beneficiary.userId,
    roundId: round._id,
    type: "payout",
    payloadHash: `0x${String(group._id).slice(-8)}${round.roundNumber.toString(16).padStart(2, "0")}`,
    status: "pending",
    createdAt: now,
  });
  await ctx.scheduler.runAfter(0, internal.chainActions.anchorProofInternal, {
    proofId,
  });

  await ctx.db.patch(round._id, {
    status: "paid_out",
    paidOutAt: now,
    collectedAmount: payoutAmount,
  });

  const nextRoundNumber = group.currentRound + 1;
  if (nextRoundNumber > group.totalRounds) {
    await ctx.db.patch(group._id, {
      status: "completed",
      currentRound: nextRoundNumber,
      totalPool: 0,
      completedAt: now,
    });
    return true;
  }

  for (const member of members) {
    if (member.status !== "excluded" && member.status !== "deceased") {
      await ctx.db.patch(member._id, { status: "waiting", paidAt: undefined });
    }
  }

  const nextBeneficiary = members.find((member) => member.turnOrder === nextRoundNumber);
  if (!nextBeneficiary) throw new ConvexError("Bénéficiaire du prochain tour introuvable.");
  const duration = frequencyMs[group.frequency] ?? frequencyMs.Mensuelle;
  const nextDueAt = now + duration;

  await ctx.db.insert("rounds", {
    groupId: group._id,
    roundNumber: nextRoundNumber,
    beneficiaryUserId: nextBeneficiary.userId,
    status: "collecting",
    expectedAmount: payoutAmount,
    collectedAmount: 0,
    dueAt: nextDueAt,
    createdAt: now,
  });

  await ctx.db.patch(group._id, {
    currentRound: nextRoundNumber,
    totalPool: 0,
    nextPayoutAt: nextDueAt,
    contributionDeadlineAt: nextDueAt,
  });

  return true;
}
