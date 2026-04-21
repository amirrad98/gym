import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

function compactOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const list = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("sportSessions").collect();
    return rows.sort((a, b) => {
      if (b.dateKey !== a.dateKey) return b.dateKey.localeCompare(a.dateKey);
      return b.createdAt - a.createdAt;
    });
  },
});

export const create = mutationGeneric({
  args: {
    dateKey: v.string(),
    sport: v.string(),
    durationMinutes: v.number(),
    distanceKm: v.optional(v.number()),
    avgPaceSecPerKm: v.optional(v.number()),
    elevationM: v.optional(v.number()),
    intensity: v.union(
      v.literal("light"),
      v.literal("steady"),
      v.literal("hard"),
    ),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sport = args.sport.trim();
    if (!sport) throw new Error("Sport is required.");
    const location = compactOptionalString(args.location);
    const notes = compactOptionalString(args.notes);
    return await ctx.db.insert("sportSessions", {
      dateKey: args.dateKey,
      sport,
      durationMinutes: args.durationMinutes,
      intensity: args.intensity,
      createdAt: Date.now(),
      ...(args.distanceKm !== undefined ? { distanceKm: args.distanceKm } : {}),
      ...(args.avgPaceSecPerKm !== undefined
        ? { avgPaceSecPerKm: args.avgPaceSecPerKm }
        : {}),
      ...(args.elevationM !== undefined ? { elevationM: args.elevationM } : {}),
      ...(location ? { location } : {}),
      ...(notes ? { notes } : {}),
    });
  },
});

export const remove = mutationGeneric({
  args: { id: v.id("sportSessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
