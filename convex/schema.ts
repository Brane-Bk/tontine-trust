import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const groupStatus = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("cancelled")
);

const memberStatus = v.union(
  v.literal("waiting"),
  v.literal("paid"),
  v.literal("late"),
  v.literal("covered"),
  v.literal("excluded"),
  v.literal("deceased")
);

const coverageStatus = v.union(
  v.literal("pending"),
  v.literal("verified"),
  v.literal("rejected")
);

const coverageType = v.union(
  v.literal("insurance"),
  v.literal("bank"),
  v.literal("deposit"),
  v.literal("guarantor")
);

const paymentStatus = v.union(
  v.literal("pending"),
  v.literal("success"),
  v.literal("failed"),
  v.literal("cancelled"),
  v.literal("simulated_success"),
  v.literal("wallet_transfer")
);

const transactionType = v.union(
  v.literal("deposit"),
  v.literal("withdrawal"),
  v.literal("contribution"),
  v.literal("payout"),
  v.literal("penalty"),
  v.literal("guarantee"),
  v.literal("refund")
);

const proofStatus = v.union(
  v.literal("pending"),
  v.literal("anchored"),
  v.literal("failed"),
  v.literal("simulated")
);

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_supabase_user", ["supabaseUserId"])
    .index("by_email", ["email"])
    .index("by_score", ["score"]),

  groups: defineTable({
    name: v.string(),
    initials: v.string(),
    color: v.string(),
    contributionAmount: v.number(),
    frequency: v.union(
      v.literal("Journalier"),
      v.literal("Hebdomadaire"),
      v.literal("Bimensuelle"),
      v.literal("Mensuelle"),
      v.literal("Trimestrielle")
    ),
    orderType: v.union(
      v.literal("manual"),
      v.literal("random"),
      v.literal("score_based")
    ),
    status: groupStatus,
    currentRound: v.number(),
    totalRounds: v.number(),
    maxMembers: v.number(),
    membersCount: v.number(),
    minScore: v.number(),
    penaltyRate: v.number(),
    totalPool: v.number(),
    nextPayoutAt: v.optional(v.number()),
    contributionDeadlineAt: v.optional(v.number()),
    gracePeriodHours: v.number(),
    coverageRequired: v.boolean(),
    commitmentRequired: v.boolean(),
    rulesHash: v.optional(v.string()),
    contractAddress: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    activatedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    cancellationReason: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_created_by", ["createdBy"])
    .index("by_status_and_deadline", ["status", "contributionDeadlineAt"]),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
    status: memberStatus,
    turnOrder: v.number(),
    paidAt: v.optional(v.number()),
    joinedAt: v.number(),
    coverageType,
    coverageStatus,
    coverageReference: v.optional(v.string()),
    coverageVerifiedAt: v.optional(v.number()),
    commitmentAcceptedAt: v.optional(v.number()),
    commitmentHash: v.optional(v.string()),
    debtAcknowledgedAt: v.optional(v.number()),
    incidentStatus: v.optional(
      v.union(
        v.literal("none"),
        v.literal("late"),
        v.literal("default"),
        v.literal("death_claim"),
        v.literal("resolved")
      )
    ),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_and_user", ["groupId", "userId"])
    .index("by_group_and_status", ["groupId", "status"])
    .index("by_group_and_turn", ["groupId", "turnOrder"]),

  rounds: defineTable({
    groupId: v.id("groups"),
    roundNumber: v.number(),
    beneficiaryUserId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("collecting"),
      v.literal("ready_for_payout"),
      v.literal("paid_out"),
      v.literal("blocked"),
      v.literal("cancelled")
    ),
    expectedAmount: v.number(),
    collectedAmount: v.number(),
    dueAt: v.number(),
    paidOutAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_group_and_round", ["groupId", "roundNumber"])
    .index("by_status_and_due", ["status", "dueAt"]),

  contributions: defineTable({
    groupId: v.id("groups"),
    roundId: v.id("rounds"),
    userId: v.id("users"),
    amount: v.number(),
    feeAmount: v.number(),
    status: paymentStatus,
    paymentRequestId: v.optional(v.id("paymentRequests")),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_round", ["roundId"])
    .index("by_round_and_user", ["roundId", "userId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  transactions: defineTable({
    userId: v.id("users"),
    groupId: v.optional(v.id("groups")),
    roundId: v.optional(v.id("rounds")),
    type: transactionType,
    name: v.string(),
    amount: v.number(),
    status: paymentStatus,
    provider: v.union(
      v.literal("kkiapay"),
      v.literal("wallet"),
      v.literal("insurance"),
      v.literal("system")
    ),
    providerReference: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    chainProofId: v.optional(v.id("chainProofs")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_group", ["groupId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  paymentRequests: defineTable({
    userId: v.id("users"),
    groupId: v.optional(v.id("groups")),
    roundId: v.optional(v.id("rounds")),
    amount: v.number(),
    type: transactionType,
    status: paymentStatus,
    provider: v.literal("kkiapay"),
    operator: v.optional(v.string()),
    customerPhone: v.string(),
    providerReference: v.optional(v.string()),
    createdAt: v.number(),
    verifiedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_provider_reference", ["providerReference"])
    .index("by_status", ["status"]),

  notifications: defineTable({
    userId: v.id("users"),
    groupId: v.optional(v.id("groups")),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("payout"),
      v.literal("reminder"),
      v.literal("late"),
      v.literal("insurance"),
      v.literal("proof"),
      v.literal("score"),
      v.literal("system")
    ),
    read: v.boolean(),
    color: v.union(
      v.literal("blue"),
      v.literal("green"),
      v.literal("orange"),
      v.literal("red"),
      v.literal("purple")
    ),
    navigateTo: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "read"])
    .index("by_group", ["groupId"]),

  chainProofs: defineTable({
    groupId: v.optional(v.id("groups")),
    userId: v.optional(v.id("users")),
    roundId: v.optional(v.id("rounds")),
    type: v.union(
      v.literal("rules"),
      v.literal("commitment"),
      v.literal("contribution"),
      v.literal("payout"),
      v.literal("incident"),
      v.literal("dissolution")
    ),
    payloadHash: v.string(),
    txHash: v.optional(v.string()),
    contractAddress: v.optional(v.string()),
    chainId: v.optional(v.number()),
    status: proofStatus,
    createdAt: v.number(),
    anchoredAt: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  incidents: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    reportedBy: v.id("users"),
    type: v.union(
      v.literal("late"),
      v.literal("default"),
      v.literal("death"),
      v.literal("dispute"),
      v.literal("dissolution")
    ),
    status: v.union(
      v.literal("open"),
      v.literal("under_review"),
      v.literal("covered"),
      v.literal("resolved"),
      v.literal("rejected")
    ),
    description: v.string(),
    resolution: v.optional(v.string()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
});
