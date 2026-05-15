import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  initialsFor,
  requireCurrentUser,
  requireGroupAdmin,
  requireGroupMember,
} from "./lib/auth";

const NETWORK_FEE = 20;

const frequencyMs: Record<string, number> = {
  Journalier: 24 * 60 * 60 * 1000,
  Hebdomadaire: 7 * 24 * 60 * 60 * 1000,
  Bimensuelle: 15 * 24 * 60 * 60 * 1000,
  Mensuelle: 30 * 24 * 60 * 60 * 1000,
  Trimestrielle: 90 * 24 * 60 * 60 * 1000,
};

function compactHash(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `0x${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function groupRulesHash(args: {
  name: string;
  contributionAmount: number;
  frequency: string;
  maxMembers: number;
  orderType: string;
  penaltyRate: number;
  minScore: number;
  coverageRequired: boolean;
  commitmentRequired: boolean;
}): string {
  return compactHash(JSON.stringify(args));
}

const groupListItem = v.object({
  id: v.id("groups"),
  name: v.string(),
  initials: v.string(),
  color: v.string(),
  contributionAmount: v.number(),
  currentRound: v.number(),
  totalRounds: v.number(),
  totalPool: v.number(),
  status: v.union(
    v.literal("pending"),
    v.literal("active"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  rulesHash: v.optional(v.string()),
});

export const listMyGroups = query({
  args: {},
  returns: v.array(groupListItem),
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const groups = [];
    for (const membership of memberships) {
      const group = await ctx.db.get(membership.groupId);
      if (!group) continue;
      groups.push({
        id: group._id,
        name: group.name,
        initials: group.initials,
        color: group.color,
        contributionAmount: group.contributionAmount,
        currentRound: group.currentRound,
        totalRounds: group.totalRounds,
        totalPool: group.totalPool,
        status: group.status,
        rulesHash: group.rulesHash,
      });
    }

    return groups;
  },
});

export const listOpenGroups = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("groups"),
      name: v.string(),
      initials: v.string(),
      color: v.string(),
      contributionAmount: v.number(),
      frequency: v.string(),
      membersCount: v.number(),
      maxMembers: v.number(),
      penaltyRate: v.number(),
      minScore: v.number(),
      rulesHash: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    await requireCurrentUser(ctx);
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return groups
      .filter((group) => group.membersCount < group.maxMembers)
      .map((group) => ({
        id: group._id,
        name: group.name,
        initials: group.initials,
        color: group.color,
        contributionAmount: group.contributionAmount,
        frequency: group.frequency,
        membersCount: group.membersCount,
        maxMembers: group.maxMembers,
        penaltyRate: group.penaltyRate,
        minScore: group.minScore,
        rulesHash: group.rulesHash,
      }));
  },
});

export const getGroupDetail = query({
  args: { groupId: v.id("groups") },
  returns: v.union(
    v.object({
      group: v.object({
        id: v.id("groups"),
        name: v.string(),
        initials: v.string(),
        color: v.string(),
        contributionAmount: v.number(),
        frequency: v.string(),
        currentRound: v.number(),
        totalRounds: v.number(),
        totalPool: v.number(),
        penaltyRate: v.number(),
        status: v.string(),
        membersCount: v.number(),
        maxMembers: v.number(),
        nextPayoutAt: v.optional(v.number()),
        contributionDeadlineAt: v.optional(v.number()),
        rulesHash: v.optional(v.string()),
        contractAddress: v.optional(v.string()),
      }),
      members: v.array(
        v.object({
          id: v.id("groupMembers"),
          userId: v.id("users"),
          name: v.string(),
          initials: v.string(),
          role: v.string(),
          status: v.string(),
          turnOrder: v.number(),
          coverageStatus: v.string(),
          commitmentHash: v.optional(v.string()),
        })
      ),
      proofs: v.array(
        v.object({
          id: v.id("chainProofs"),
          type: v.string(),
          payloadHash: v.string(),
          txHash: v.optional(v.string()),
          status: v.string(),
          createdAt: v.number(),
        })
      ),
      isMember: v.boolean(),
      isAdmin: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const currentUser = await requireCurrentUser(ctx);
    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const currentMembership = memberships.find(
      (membership) => membership.userId === currentUser._id
    );

    const members = [];
    for (const membership of memberships.sort((a, b) => a.turnOrder - b.turnOrder)) {
      const memberUser = await ctx.db.get(membership.userId);
      members.push({
        id: membership._id,
        userId: membership.userId,
        name: memberUser?.name ?? "Membre",
        initials: memberUser?.initials ?? "MB",
        role: membership.role,
        status: membership.status,
        turnOrder: membership.turnOrder,
        coverageStatus: membership.coverageStatus,
        commitmentHash: membership.commitmentHash,
      });
    }

    const proofs = await ctx.db
      .query("chainProofs")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    return {
      group: {
        id: group._id,
        name: group.name,
        initials: group.initials,
        color: group.color,
        contributionAmount: group.contributionAmount,
        frequency: group.frequency,
        currentRound: group.currentRound,
        totalRounds: group.totalRounds,
        totalPool: group.totalPool,
        penaltyRate: group.penaltyRate,
        status: group.status,
        membersCount: group.membersCount,
        maxMembers: group.maxMembers,
        nextPayoutAt: group.nextPayoutAt,
        contributionDeadlineAt: group.contributionDeadlineAt,
        rulesHash: group.rulesHash,
        contractAddress: group.contractAddress,
      },
      members,
      proofs: proofs
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 8)
        .map((proof) => ({
          id: proof._id,
          type: proof.type,
          payloadHash: proof.payloadHash,
          txHash: proof.txHash,
          status: proof.status,
          createdAt: proof.createdAt,
        })),
      isMember: Boolean(currentMembership),
      isAdmin: currentMembership?.role === "admin",
    };
  },
});

export const createGroup = mutation({
  args: {
    name: v.string(),
    contributionAmount: v.number(),
    frequency: v.union(
      v.literal("Journalier"),
      v.literal("Hebdomadaire"),
      v.literal("Bimensuelle"),
      v.literal("Mensuelle"),
      v.literal("Trimestrielle")
    ),
    maxMembers: v.number(),
    orderType: v.union(v.literal("manual"), v.literal("random")),
    penaltyRate: v.number(),
    minScore: v.number(),
    coverageType: v.union(
      v.literal("insurance"),
      v.literal("bank"),
      v.literal("deposit"),
      v.literal("guarantor")
    ),
    coverageReference: v.string(),
    commitmentAccepted: v.boolean(),
  },
  returns: v.id("groups"),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    if (!args.name.trim()) throw new ConvexError("Nom du groupe requis.");
    if (args.contributionAmount <= 0) {
      throw new ConvexError("Le montant de cotisation doit être positif.");
    }
    if (args.maxMembers < 2 || args.maxMembers > 50) {
      throw new ConvexError("Le groupe doit contenir entre 2 et 50 membres.");
    }
    if (!args.coverageReference.trim()) {
      throw new ConvexError("Une référence de couverture est obligatoire.");
    }
    if (!args.commitmentAccepted) {
      throw new ConvexError("La reconnaissance d'engagement doit être acceptée.");
    }

    const now = Date.now();
    const rulesHash = groupRulesHash({
      name: args.name.trim(),
      contributionAmount: args.contributionAmount,
      frequency: args.frequency,
      maxMembers: args.maxMembers,
      orderType: args.orderType,
      penaltyRate: args.penaltyRate,
      minScore: args.minScore,
      coverageRequired: true,
      commitmentRequired: true,
    });

    const colors = ["green", "blue", "amber", "purple", "red"];
    const groupId = await ctx.db.insert("groups", {
      name: args.name.trim(),
      initials: initialsFor(args.name),
      color: colors[Math.floor(Math.random() * colors.length)],
      contributionAmount: args.contributionAmount,
      frequency: args.frequency,
      orderType: args.orderType,
      status: "pending",
      currentRound: 0,
      totalRounds: args.maxMembers,
      maxMembers: args.maxMembers,
      membersCount: 1,
      minScore: args.minScore,
      penaltyRate: args.penaltyRate,
      totalPool: 0,
      gracePeriodHours: 24,
      coverageRequired: true,
      commitmentRequired: true,
      rulesHash,
      createdBy: user._id,
      createdAt: now,
    });

    const commitmentHash = compactHash(
      JSON.stringify({ groupId, userId: user._id, rulesHash, acceptedAt: now })
    );

    await ctx.db.insert("groupMembers", {
      groupId,
      userId: user._id,
      role: "admin",
      status: "waiting",
      turnOrder: 1,
      joinedAt: now,
      coverageType: args.coverageType,
      coverageStatus: "verified",
      coverageReference: args.coverageReference.trim(),
      coverageVerifiedAt: now,
      commitmentAcceptedAt: now,
      commitmentHash,
      debtAcknowledgedAt: now,
      incidentStatus: "none",
    });

    await ctx.db.patch(user._id, {
      groupsCount: user.groupsCount + 1,
      updatedAt: now,
    });

    const rulesProofId = await ctx.db.insert("chainProofs", {
      groupId,
      userId: user._id,
      type: "rules",
      payloadHash: rulesHash,
      status: "pending",
      createdAt: now,
    });
    const commitmentProofId = await ctx.db.insert("chainProofs", {
      groupId,
      userId: user._id,
      type: "commitment",
      payloadHash: commitmentHash,
      status: "pending",
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.chainActions.anchorProofInternal, {
      proofId: rulesProofId,
    });
    await ctx.scheduler.runAfter(0, internal.chainActions.anchorProofInternal, {
      proofId: commitmentProofId,
    });

    return groupId;
  },
});

export const joinGroup = mutation({
  args: {
    groupId: v.id("groups"),
    coverageType: v.union(
      v.literal("insurance"),
      v.literal("bank"),
      v.literal("deposit"),
      v.literal("guarantor")
    ),
    coverageReference: v.string(),
    commitmentAccepted: v.boolean(),
  },
  returns: v.id("groupMembers"),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new ConvexError("Groupe introuvable.");
    if (group.status !== "pending") {
      throw new ConvexError("Ce groupe n'est plus ouvert aux inscriptions.");
    }
    if (group.membersCount >= group.maxMembers) {
      throw new ConvexError("Ce groupe est complet.");
    }
    if (user.score < group.minScore) {
      throw new ConvexError("Votre score est insuffisant pour rejoindre ce groupe.");
    }
    if (!args.coverageReference.trim()) {
      throw new ConvexError("Une référence de couverture est obligatoire.");
    }
    if (!args.commitmentAccepted) {
      throw new ConvexError("La reconnaissance d'engagement doit être acceptée.");
    }

    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id)
      )
      .unique();
    if (existing) throw new ConvexError("Vous êtes déjà membre de ce groupe.");

    const now = Date.now();
    const commitmentHash = compactHash(
      JSON.stringify({
        groupId: args.groupId,
        userId: user._id,
        rulesHash: group.rulesHash,
        acceptedAt: now,
      })
    );

    const memberId = await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      userId: user._id,
      role: "member",
      status: "waiting",
      turnOrder: group.membersCount + 1,
      joinedAt: now,
      coverageType: args.coverageType,
      coverageStatus: args.coverageType === "deposit" ? "pending" : "verified",
      coverageReference: args.coverageReference.trim(),
      coverageVerifiedAt: args.coverageType === "deposit" ? undefined : now,
      commitmentAcceptedAt: now,
      commitmentHash,
      debtAcknowledgedAt: now,
      incidentStatus: "none",
    });

    await ctx.db.patch(args.groupId, {
      membersCount: group.membersCount + 1,
    });
    await ctx.db.patch(user._id, {
      groupsCount: user.groupsCount + 1,
      updatedAt: now,
    });
    const proofId = await ctx.db.insert("chainProofs", {
      groupId: args.groupId,
      userId: user._id,
      type: "commitment",
      payloadHash: commitmentHash,
      status: "pending",
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.chainActions.anchorProofInternal, {
      proofId,
    });

    return memberId;
  },
});

export const activateGroup = mutation({
  args: { groupId: v.id("groups") },
  returns: v.id("groups"),
  handler: async (ctx, args) => {
    await requireGroupAdmin(ctx, args.groupId);
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new ConvexError("Groupe introuvable.");
    if (group.status !== "pending") {
      throw new ConvexError("Le groupe n'est pas en attente.");
    }

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    if (members.length !== group.maxMembers) {
      throw new ConvexError("Tous les membres doivent rejoindre avant activation.");
    }
    if (
      members.some(
        (member) => !member.commitmentAcceptedAt || member.coverageStatus !== "verified"
      )
    ) {
      throw new ConvexError("Tous les engagements et couvertures doivent être validés.");
    }

    const now = Date.now();
    const duration = frequencyMs[group.frequency] ?? frequencyMs.Mensuelle;
    const firstDeadline = now + duration;
    await ctx.db.patch(args.groupId, {
      status: "active",
      currentRound: 1,
      activatedAt: now,
      nextPayoutAt: firstDeadline,
      contributionDeadlineAt: firstDeadline,
    });

    for (const member of members) {
      await ctx.db.patch(member._id, { status: "waiting", paidAt: undefined });
    }

    const beneficiary = members.find((member) => member.turnOrder === 1);
    if (!beneficiary) throw new ConvexError("Bénéficiaire du premier tour introuvable.");

    await ctx.db.insert("rounds", {
      groupId: args.groupId,
      roundNumber: 1,
      beneficiaryUserId: beneficiary.userId,
      status: "collecting",
      expectedAmount: group.contributionAmount * members.length,
      collectedAmount: 0,
      dueAt: firstDeadline,
      createdAt: now,
    });

    return args.groupId;
  },
});

export const reportIncident = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
    type: v.union(
      v.literal("late"),
      v.literal("default"),
      v.literal("death"),
      v.literal("dispute"),
      v.literal("dissolution")
    ),
    description: v.string(),
  },
  returns: v.id("incidents"),
  handler: async (ctx, args) => {
    const { user } = await requireGroupMember(ctx, args.groupId);
    const targetMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.userId)
      )
      .unique();
    if (!targetMembership) throw new ConvexError("Membre concerné introuvable.");

    const now = Date.now();
    const incidentId = await ctx.db.insert("incidents", {
      groupId: args.groupId,
      userId: args.userId,
      reportedBy: user._id,
      type: args.type,
      status: "open",
      description: args.description.trim(),
      createdAt: now,
    });

    const status = args.type === "death" ? "deceased" : args.type === "late" ? "late" : "covered";
    const incidentStatus =
      args.type === "death"
        ? "death_claim"
        : args.type === "late" || args.type === "default"
          ? args.type
          : "resolved";
    await ctx.db.patch(targetMembership._id, {
      status,
      incidentStatus,
    });

    const proofId = await ctx.db.insert("chainProofs", {
      groupId: args.groupId,
      userId: args.userId,
      type: "incident",
      payloadHash: compactHash(JSON.stringify({ incidentId, type: args.type, at: now })),
      status: "pending",
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.chainActions.anchorProofInternal, {
      proofId,
    });

    return incidentId;
  },
});

export const requestDissolution = mutation({
  args: {
    groupId: v.id("groups"),
    reason: v.string(),
  },
  returns: v.id("groups"),
  handler: async (ctx, args) => {
    await requireGroupAdmin(ctx, args.groupId);
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new ConvexError("Groupe introuvable.");
    if (group.status === "completed" || group.status === "cancelled") {
      throw new ConvexError("Ce groupe est déjà clôturé.");
    }

    const now = Date.now();
    await ctx.db.patch(args.groupId, {
      status: "cancelled",
      cancelledAt: now,
      cancellationReason: args.reason.trim(),
    });
    const proofId = await ctx.db.insert("chainProofs", {
      groupId: args.groupId,
      type: "dissolution",
      payloadHash: compactHash(JSON.stringify({ groupId: args.groupId, reason: args.reason, at: now })),
      status: "pending",
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.chainActions.anchorProofInternal, {
      proofId,
    });

    return args.groupId;
  },
});

export const markContributionPaidInternal = internalMutation({
  args: {
    groupId: v.id("groups"),
    roundId: v.id("rounds"),
    userId: v.id("users"),
    amount: v.number(),
    feeAmount: v.number(),
    paymentRequestId: v.optional(v.id("paymentRequests")),
    providerReference: v.optional(v.string()),
    provider: v.union(v.literal("kkiapay"), v.literal("wallet")),
  },
  returns: v.id("contributions"),
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    const round = await ctx.db.get(args.roundId);
    if (!group || !round) throw new ConvexError("Groupe ou tour introuvable.");

    const existing = await ctx.db
      .query("contributions")
      .withIndex("by_round_and_user", (q) =>
        q.eq("roundId", args.roundId).eq("userId", args.userId)
      )
      .unique();
    if (existing && existing.status !== "failed") return existing._id;

    const now = Date.now();
    const contributionId = await ctx.db.insert("contributions", {
      groupId: args.groupId,
      roundId: args.roundId,
      userId: args.userId,
      amount: args.amount,
      feeAmount: args.feeAmount,
      status: args.provider === "wallet" ? "wallet_transfer" : "success",
      paymentRequestId: args.paymentRequestId,
      paidAt: now,
      createdAt: now,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      groupId: args.groupId,
      roundId: args.roundId,
      type: "contribution",
      name: `Cotisation tour ${round.roundNumber} — ${group.name}`,
      amount: -Math.abs(args.amount + args.feeAmount),
      status: args.provider === "wallet" ? "wallet_transfer" : "success",
      provider: args.provider,
      providerReference: args.providerReference,
      createdAt: now,
    });

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.userId)
      )
      .unique();
    if (membership) {
      await ctx.db.patch(membership._id, { status: "paid", paidAt: now });
    }

    await ctx.db.patch(args.groupId, {
      totalPool: group.totalPool + args.amount,
    });
    await ctx.db.patch(args.roundId, {
      collectedAmount: round.collectedAmount + args.amount,
    });

    const proofId = await ctx.db.insert("chainProofs", {
      groupId: args.groupId,
      userId: args.userId,
      roundId: args.roundId,
      type: "contribution",
      payloadHash: compactHash(
        JSON.stringify({
          groupId: args.groupId,
          roundId: args.roundId,
          userId: args.userId,
          amount: args.amount,
          reference: args.providerReference,
        })
      ),
      status: "pending",
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.chainActions.anchorProofInternal, {
      proofId,
    });

    await ctx.scheduler.runAfter(0, internal.automation.finalizeReadyRounds, {
      groupId: args.groupId,
    });

    return contributionId;
  },
});

export const currentRoundForGroup = query({
  args: { groupId: v.id("groups") },
  returns: v.union(
    v.object({
      roundId: v.id("rounds"),
      roundNumber: v.number(),
      contributionAmount: v.number(),
      networkFee: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireGroupMember(ctx, args.groupId);
    const group = await ctx.db.get(args.groupId);
    if (!group || group.status !== "active") return null;
    const round = await ctx.db
      .query("rounds")
      .withIndex("by_group_and_round", (q) =>
        q.eq("groupId", args.groupId).eq("roundNumber", group.currentRound)
      )
      .unique();
    if (!round) return null;

    return {
      roundId: round._id,
      roundNumber: round.roundNumber,
      contributionAmount: group.contributionAmount,
      networkFee: NETWORK_FEE,
    };
  },
});
