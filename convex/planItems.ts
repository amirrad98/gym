import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const categoryValidator = v.union(
  v.literal("task"),
  v.literal("habit"),
  v.literal("milestone"),
);

const domainValidator = v.union(
  v.literal("general"),
  v.literal("training"),
  v.literal("study"),
  v.literal("life"),
);

function compactOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const list = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("planItems").collect();
    return rows.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (b.dateKey !== a.dateKey) return b.dateKey.localeCompare(a.dateKey);
      return b.createdAt - a.createdAt;
    });
  },
});

export const create = mutationGeneric({
  args: {
    dateKey: v.string(),
    title: v.string(),
    category: categoryValidator,
    domain: domainValidator,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (!title) throw new Error("Title is required.");
    const notes = compactOptionalString(args.notes);
    const now = Date.now();
    return await ctx.db.insert("planItems", {
      dateKey: args.dateKey,
      title,
      category: args.category,
      domain: args.domain,
      completed: false,
      createdAt: now,
      updatedAt: now,
      ...(notes ? { notes } : {}),
    });
  },
});

export const toggle = mutationGeneric({
  args: { id: v.id("planItems"), completed: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      completed: args.completed,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutationGeneric({
  args: { id: v.id("planItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
