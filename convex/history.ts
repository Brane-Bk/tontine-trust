import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth";

const transactionView = v.object({
  id: v.id("transactions"),
  name: v.string(),
  amount: v.number(),
  type: v.string(),
  status: v.string(),
  provider: v.string(),
  providerReference: v.optional(v.string()),
  groupName: v.optional(v.string()),
  createdAt: v.number(),
});

export const listMine = query({
  args: {
    filter: v.optional(
      v.union(
        v.literal("all"),
        v.literal("payout"),
        v.literal("contribution"),
        v.literal("penalty")
      )
    ),
  },
  returns: v.array(transactionView),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);

    const filter = args.filter ?? "all";
    const filtered = filter === "all" ? rows : rows.filter((row) => row.type === filter);

    const result = [] as Array<{
      id: typeof rows[number]["_id"];
      name: string;
      amount: number;
      type: string;
      status: string;
      provider: string;
      providerReference?: string;
      groupName?: string;
      createdAt: number;
    }>;

    for (const row of filtered) {
      let groupName: string | undefined;
      if (row.groupId) {
        const group = await ctx.db.get(row.groupId);
        groupName = group?.name;
      }
      result.push({
        id: row._id,
        name: row.name,
        amount: row.amount,
        type: row.type,
        status: row.status,
        provider: row.provider,
        providerReference: row.providerReference,
        groupName,
        createdAt: row.createdAt,
      });
    }

    return result;
  },
});
