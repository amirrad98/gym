import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

function compactOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const create = mutationGeneric({
  args: {
    dateKey: v.string(),
    exercise: v.string(),
    muscleGroup: v.string(),
    sets: v.number(),
    reps: v.number(),
    weightKg: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
    effort: v.union(v.literal("light"), v.literal("steady"), v.literal("hard")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notes = compactOptionalString(args.notes);

    return await ctx.db.insert("workoutLogs", {
      dateKey: args.dateKey,
      exercise: args.exercise.trim(),
      muscleGroup: args.muscleGroup,
      sets: args.sets,
      reps: args.reps,
      effort: args.effort,
      createdAt: Date.now(),
      ...(args.weightKg !== undefined ? { weightKg: args.weightKg } : {}),
      ...(args.durationMinutes !== undefined
        ? { durationMinutes: args.durationMinutes }
        : {}),
      ...(notes ? { notes } : {}),
    });
  },
});

export const remove = mutationGeneric({
  args: {
    id: v.id("workoutLogs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
