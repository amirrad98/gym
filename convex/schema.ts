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

  exercises: defineTable({
    name: v.string(),
    muscleGroup: v.string(),
    equipment: v.optional(v.string()),
    defaultSets: v.optional(v.number()),
    defaultReps: v.optional(v.number()),
    defaultWeightKg: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_muscleGroup", ["muscleGroup"]),

  goals: defineTable({
    title: v.string(),
    category: v.union(
      v.literal("strength"),
      v.literal("weight"),
      v.literal("habit"),
      v.literal("endurance"),
      v.literal("other"),
    ),
    targetValue: v.optional(v.number()),
    targetUnit: v.optional(v.string()),
    currentValue: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    completed: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_completed", ["completed"]),

  bodyMeasurements: defineTable({
    dateKey: v.string(),
    bodyWeightKg: v.optional(v.number()),
    bodyFatPercent: v.optional(v.number()),
    waistCm: v.optional(v.number()),
    chestCm: v.optional(v.number()),
    hipsCm: v.optional(v.number()),
    leftArmCm: v.optional(v.number()),
    rightArmCm: v.optional(v.number()),
    leftThighCm: v.optional(v.number()),
    rightThighCm: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_dateKey", ["dateKey"]),

  programs: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    dayOfWeek: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  programExercises: defineTable({
    programId: v.id("programs"),
    exercise: v.string(),
    muscleGroup: v.string(),
    sets: v.number(),
    reps: v.number(),
    weightKg: v.optional(v.number()),
    order: v.number(),
    notes: v.optional(v.string()),
  }).index("by_program", ["programId"]),

  sportSessions: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_dateKey", ["dateKey"])
    .index("by_sport", ["sport"]),

  studySessions: defineTable({
    dateKey: v.string(),
    subject: v.string(),
    topic: v.optional(v.string()),
    durationMinutes: v.number(),
    focus: v.number(), // 1-5
    pomodoros: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_dateKey", ["dateKey"])
    .index("by_subject", ["subject"]),

  planItems: defineTable({
    dateKey: v.string(),
    title: v.string(),
    category: v.union(
      v.literal("task"),
      v.literal("habit"),
      v.literal("milestone"),
    ),
    domain: v.union(
      v.literal("general"),
      v.literal("training"),
      v.literal("study"),
      v.literal("life"),
    ),
    completed: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_dateKey", ["dateKey"])
    .index("by_completed", ["completed"]),
});
