import { queryGeneric } from "convex/server";
import { v } from "convex/values";

type DaySummary = {
  dateKey: string;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  totalMinutes: number;
  workoutCount: number;
  completedWorkout: boolean;
  energy: number | null;
  mood: number | null;
  bodyWeightKg: number | null;
};

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateKey(date: Date) {
  return [
    date.getUTCFullYear(),
    `${date.getUTCMonth() + 1}`.padStart(2, "0"),
    `${date.getUTCDate()}`.padStart(2, "0"),
  ].join("-");
}

function shiftDateKey(dateKey: string, offset: number) {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + offset);
  return formatDateKey(date);
}

function volumeForLog(log: {
  sets: number;
  reps: number;
  weightKg?: number;
}) {
  return log.weightKg ? log.weightKg * log.reps * log.sets : 0;
}

function ensureSummary(map: Map<string, DaySummary>, dateKey: string) {
  const existing = map.get(dateKey);

  if (existing) {
    return existing;
  }

  const next = {
    dateKey,
    totalSets: 0,
    totalReps: 0,
    totalVolume: 0,
    totalMinutes: 0,
    workoutCount: 0,
    completedWorkout: false,
    energy: null,
    mood: null,
    bodyWeightKg: null,
  };

  map.set(dateKey, next);
  return next;
}

export const get = queryGeneric({
  args: {
    dateKey: v.string(),
  },
  handler: async (ctx, args) => {
    const [checkins, workoutLogs] = await Promise.all([
      ctx.db.query("dailyCheckins").collect(),
      ctx.db.query("workoutLogs").collect(),
    ]);

    const selectedLogs = workoutLogs
      .filter((log) => log.dateKey === args.dateKey)
      .sort((left, right) => right.createdAt - left.createdAt);

    const selectedCheckin =
      checkins.find((checkin) => checkin.dateKey === args.dateKey) ?? null;

    const summaryByDate = new Map<string, DaySummary>();

    for (const checkin of checkins) {
      const summary = ensureSummary(summaryByDate, checkin.dateKey);
      summary.completedWorkout = summary.completedWorkout || checkin.completedWorkout;
      summary.energy = checkin.energy;
      summary.mood = checkin.mood;
      summary.bodyWeightKg = checkin.bodyWeightKg ?? null;
    }

    for (const log of workoutLogs) {
      const summary = ensureSummary(summaryByDate, log.dateKey);
      summary.totalSets += log.sets;
      summary.totalReps += log.sets * log.reps;
      summary.totalVolume += volumeForLog(log);
      summary.totalMinutes += log.durationMinutes ?? 0;
      summary.workoutCount += 1;
      summary.completedWorkout = true;
    }

    const recentDays = [...summaryByDate.values()]
      .sort((left, right) => right.dateKey.localeCompare(left.dateKey))
      .slice(0, 8);

    const weekKeys = new Set<string>();
    for (let offset = 0; offset < 7; offset += 1) {
      weekKeys.add(shiftDateKey(args.dateKey, -offset));
    }

    const weeklySummary = [...weekKeys].reduce(
      (summary, dateKey) => {
        const day = summaryByDate.get(dateKey);

        if (!day) {
          return summary;
        }

        return {
          activeDays:
            summary.activeDays + (day.completedWorkout || day.totalSets > 0 ? 1 : 0),
          totalSets: summary.totalSets + day.totalSets,
          totalVolume: summary.totalVolume + day.totalVolume,
          totalMinutes: summary.totalMinutes + day.totalMinutes,
        };
      },
      {
        activeDays: 0,
        totalSets: 0,
        totalVolume: 0,
        totalMinutes: 0,
      },
    );

    const activeDates = new Set<string>();
    for (const day of summaryByDate.values()) {
      if (day.completedWorkout || day.totalSets > 0) {
        activeDates.add(day.dateKey);
      }
    }

    let streak = 0;
    for (let cursor = args.dateKey; activeDates.has(cursor); cursor = shiftDateKey(cursor, -1)) {
      streak += 1;
    }

    const recentWindowKeys = new Set<string>();
    for (let offset = 0; offset < 14; offset += 1) {
      recentWindowKeys.add(shiftDateKey(args.dateKey, -offset));
    }

    const muscleGroupMap = new Map<string, number>();
    const highlightMap = new Map<
      string,
      {
        exercise: string;
        muscleGroup: string;
        bestWeightKg: number | null;
        totalSets: number;
        totalVolume: number;
        lastLoggedAt: number;
      }
    >();

    for (const log of workoutLogs) {
      if (recentWindowKeys.has(log.dateKey)) {
        muscleGroupMap.set(
          log.muscleGroup,
          (muscleGroupMap.get(log.muscleGroup) ?? 0) + 1,
        );
      }

      const existing = highlightMap.get(log.exercise);
      if (existing) {
        existing.bestWeightKg = Math.max(existing.bestWeightKg ?? 0, log.weightKg ?? 0) || null;
        existing.totalSets += log.sets;
        existing.totalVolume += volumeForLog(log);
        existing.lastLoggedAt = Math.max(existing.lastLoggedAt, log.createdAt);
      } else {
        highlightMap.set(log.exercise, {
          exercise: log.exercise,
          muscleGroup: log.muscleGroup,
          bestWeightKg: log.weightKg ?? null,
          totalSets: log.sets,
          totalVolume: volumeForLog(log),
          lastLoggedAt: log.createdAt,
        });
      }
    }

    const muscleGroupBreakdown = [...muscleGroupMap.entries()]
      .map(([muscleGroup, workoutCount]) => ({ muscleGroup, workoutCount }))
      .sort((left, right) => right.workoutCount - left.workoutCount)
      .slice(0, 6);

    const exerciseHighlights = [...highlightMap.values()]
      .sort((left, right) => right.lastLoggedAt - left.lastLoggedAt)
      .slice(0, 6);

    return {
      selectedDateKey: args.dateKey,
      selectedCheckin,
      selectedLogs,
      streak,
      recentDays,
      weeklySummary,
      muscleGroupBreakdown,
      exerciseHighlights,
    };
  },
});
