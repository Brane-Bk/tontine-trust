import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = QueryCtx | MutationCtx;

export async function requireCurrentUser(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Authentification requise.");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  if (!user) {
    throw new ConvexError("Profil Convex introuvable. Synchronisez le profil.");
  }

  return user;
}

export async function requireGroupMember(
  ctx: AuthCtx,
  groupId: Id<"groups">
) {
  const user = await requireCurrentUser(ctx);
  const member = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_and_user", (q) =>
      q.eq("groupId", groupId).eq("userId", user._id)
    )
    .unique();

  if (!member) {
    throw new ConvexError("Accès refusé : vous n'êtes pas membre du groupe.");
  }

  return { user, member };
}

export async function requireGroupAdmin(
  ctx: AuthCtx,
  groupId: Id<"groups">
) {
  const membership = await requireGroupMember(ctx, groupId);
  if (membership.member.role !== "admin") {
    throw new ConvexError("Action réservée à l'administrateur du groupe.");
  }
  return membership;
}

export function initialsFor(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials || "TC";
}
