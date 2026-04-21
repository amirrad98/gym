import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  dailyCheckins: defineTable({
    dateKey: v.string(),
    bodyWeightKg: v.optional(v.number()),
    sleepHours: v.number(),
    energy: v.number(),
    mood: v.number(),
    soreness: v.number(),
    hydrationLiters: v.optional(v.number()),
    completedWorkout: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_dateKey", ["dateKey"]),
  workoutLogs: defineTable({
    dateKey: v.string(),
    exercise: v.string(),
    muscleGroup: v.string(),
    sets: v.number(),
    reps: v.number(),
    weightKg: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
    effort: v.union(v.literal("light"), v.literal("steady"), v.literal("hard")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_dateKey", ["dateKey"])
    .index("by_exercise", ["exercise"]),
});
