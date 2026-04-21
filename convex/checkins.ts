import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

function compactOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const upsert = mutationGeneric({
  args: {
    dateKey: v.string(),
    bodyWeightKg: v.optional(v.number()),
    sleepHours: v.number(),
    energy: v.number(),
    mood: v.number(),
    soreness: v.number(),
    hydrationLiters: v.optional(v.number()),
    completedWorkout: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_dateKey", (query) => query.eq("dateKey", args.dateKey))
      .unique();

    const now = Date.now();
    const notes = compactOptionalString(args.notes);
    const payload = {
      dateKey: args.dateKey,
      sleepHours: args.sleepHours,
      energy: args.energy,
      mood: args.mood,
      soreness: args.soreness,
      completedWorkout: args.completedWorkout,
      updatedAt: now,
      ...(args.bodyWeightKg !== undefined ? { bodyWeightKg: args.bodyWeightKg } : {}),
      ...(args.hydrationLiters !== undefined
        ? { hydrationLiters: args.hydrationLiters }
        : {}),
      ...(notes ? { notes } : {}),
    };

    if (existing) {
      await ctx.db.replace(existing._id, {
        ...payload,
        createdAt: existing.createdAt,
      });
      return existing._id;
    }

    return await ctx.db.insert("dailyCheckins", {
      ...payload,
      createdAt: now,
    });
  },
});
