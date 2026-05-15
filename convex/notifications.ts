import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth";

const notificationView = v.object({
  id: v.id("notifications"),
  title: v.string(),
  message: v.string(),
  type: v.string(),
  read: v.boolean(),
  color: v.string(),
  navigateTo: v.optional(v.string()),
  createdAt: v.number(),
});

export const listMine = query({
  args: {},
  returns: v.array(notificationView),
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    return rows.map((row) => ({
      id: row._id,
      title: row.title,
      message: row.message,
      type: row.type,
      read: row.read,
      color: row.color,
      navigateTo: row.navigateTo,
      createdAt: row.createdAt,
    }));
  },
});

export const unreadCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false)
      )
      .collect();
    return rows.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new ConvexError("Notification introuvable.");
    }
    if (notification.userId !== user._id) {
      throw new ConvexError("Accès refusé.");
    }
    if (notification.read) return true;
    await ctx.db.patch(args.notificationId, { read: true });
    return true;
  },
});

export const markAllRead = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false)
      )
      .collect();
    for (const row of rows) {
      await ctx.db.patch(row._id, { read: true });
    }
    return rows.length;
  },
});
