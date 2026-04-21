import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

function compactOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const list = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("studySessions").collect();
    return rows.sort((a, b) => {
      if (b.dateKey !== a.dateKey) return b.dateKey.localeCompare(a.dateKey);
      return b.createdAt - a.createdAt;
    });
  },
});

export const create = mutationGeneric({
  args: {
    dateKey: v.string(),
    subject: v.string(),
    topic: v.optional(v.string()),
    durationMinutes: v.number(),
    focus: v.number(),
    pomodoros: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const subject = args.subject.trim();
    if (!subject) throw new Error("Subject is required.");
    const topic = compactOptionalString(args.topic);
    const notes = compactOptionalString(args.notes);
    return await ctx.db.insert("studySessions", {
      dateKey: args.dateKey,
      subject,
      durationMinutes: args.durationMinutes,
      focus: args.focus,
      createdAt: Date.now(),
      ...(topic ? { topic } : {}),
      ...(args.pomodoros !== undefined ? { pomodoros: args.pomodoros } : {}),
      ...(notes ? { notes } : {}),
    });
  },
});

export const remove = mutationGeneric({
  args: { id: v.id("studySessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
