import { useEffect, useMemo, useState } from "react";
import type {
  BodyMeasurementRecord,
  CheckinRecord,
  ExerciseRecord,
  GoalRecord,
  PlanItemRecord,
  ProgramExerciseRecord,
  ProgramRecord,
  ProgramWithExercises,
  SaveCheckinArgs,
  SaveExerciseArgs,
  SaveGoalArgs,
  SaveMeasurementArgs,
  SavePlanArgs,
  SaveProgramArgs,
  SaveProgramExerciseArgs,
  SaveSportArgs,
  SaveStudyArgs,
  SaveWorkoutArgs,
  SportSessionRecord,
  StudySessionRecord,
  TrackerBundle,
  WorkoutLogRecord,
} from "./types";
import { buildDashboardData } from "./dashboard";
import { createLocalId } from "./utils";

const LOCAL_STORAGE_KEY = "gym-tracker-browser-data-v3";

type LocalStore = {
  checkins: CheckinRecord[];
  workoutLogs: WorkoutLogRecord[];
  exercises: ExerciseRecord[];
  goals: GoalRecord[];
  measurements: BodyMeasurementRecord[];
  programs: ProgramRecord[];
  programExercises: ProgramExerciseRecord[];
  sports: SportSessionRecord[];
  studies: StudySessionRecord[];
  plans: PlanItemRecord[];
};

function emptyStore(): LocalStore {
  return {
    checkins: [],
    workoutLogs: [],
    exercises: [],
    goals: [],
    measurements: [],
    programs: [],
    programExercises: [],
    sports: [],
    studies: [],
    plans: [],
  };
}

function loadStore(): LocalStore {
  if (typeof window === "undefined") return emptyStore();
  const raw =
    window.localStorage.getItem(LOCAL_STORAGE_KEY) ||
    window.localStorage.getItem("gym-tracker-browser-data-v2") ||
    window.localStorage.getItem("gym-tracker-browser-data-v1");
  if (!raw) return emptyStore();
  try {
    const parsed = JSON.parse(raw) as Partial<LocalStore>;
    return {
      ...emptyStore(),
      ...parsed,
      checkins: Array.isArray(parsed.checkins) ? parsed.checkins : [],
      workoutLogs: Array.isArray(parsed.workoutLogs) ? parsed.workoutLogs : [],
      exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      measurements: Array.isArray(parsed.measurements) ? parsed.measurements : [],
      programs: Array.isArray(parsed.programs) ? parsed.programs : [],
      programExercises: Array.isArray(parsed.programExercises)
        ? parsed.programExercises
        : [],
      sports: Array.isArray(parsed.sports) ? parsed.sports : [],
      studies: Array.isArray(parsed.studies) ? parsed.studies : [],
      plans: Array.isArray(parsed.plans) ? parsed.plans : [],
    };
  } catch {
    return emptyStore();
  }
}

export function useLocalTracker(selectedDateKey: string): TrackerBundle {
  const [store, setStore] = useState<LocalStore>(loadStore);

  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const dashboard = useMemo(
    () => buildDashboardData(selectedDateKey, store.checkins, store.workoutLogs),
    [selectedDateKey, store.checkins, store.workoutLogs],
  );

  const programs = useMemo<ProgramWithExercises[]>(() => {
    return store.programs
      .map((program) => ({
        program,
        exercises: store.programExercises
          .filter((ex) => ex.programId === program._id)
          .sort((a, b) => a.order - b.order),
      }))
      .sort((a, b) => a.program.name.localeCompare(b.program.name));
  }, [store.programs, store.programExercises]);

  async function saveCheckin(args: SaveCheckinArgs) {
    setStore((current) => {
      const existing = current.checkins.find((c) => c.dateKey === args.dateKey);
      const now = Date.now();
      const nextRecord: CheckinRecord = {
        _id: existing?._id ?? createLocalId("checkin"),
        dateKey: args.dateKey,
        sleepHours: args.sleepHours,
        energy: args.energy,
        mood: args.mood,
        soreness: args.soreness,
        completedWorkout: args.completedWorkout,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        ...(args.bodyWeightKg !== undefined ? { bodyWeightKg: args.bodyWeightKg } : {}),
        ...(args.hydrationLiters !== undefined
          ? { hydrationLiters: args.hydrationLiters }
          : {}),
        ...(args.notes ? { notes: args.notes } : {}),
      };
      return {
        ...current,
        checkins: existing
          ? current.checkins.map((c) => (c.dateKey === args.dateKey ? nextRecord : c))
          : [...current.checkins, nextRecord],
      };
    });
    return null;
  }

  async function createWorkout(args: SaveWorkoutArgs) {
    const record: WorkoutLogRecord = {
      _id: createLocalId("log"),
      createdAt: Date.now(),
      ...args,
    };
    setStore((current) => ({
      ...current,
      workoutLogs: [...current.workoutLogs, record],
    }));
    return null;
  }

  async function removeWorkout(id: string) {
    setStore((current) => ({
      ...current,
      workoutLogs: current.workoutLogs.filter((log) => log._id !== id),
    }));
  }

  async function createExercise(args: SaveExerciseArgs) {
    const record: ExerciseRecord = {
      _id: createLocalId("exercise"),
      createdAt: Date.now(),
      ...args,
    };
    setStore((current) => ({ ...current, exercises: [...current.exercises, record] }));
    return null;
  }

  async function removeExercise(id: string) {
    setStore((current) => ({
      ...current,
      exercises: current.exercises.filter((ex) => ex._id !== id),
    }));
  }

  async function createGoal(args: SaveGoalArgs) {
    const now = Date.now();
    const record: GoalRecord = {
      _id: createLocalId("goal"),
      completed: false,
      createdAt: now,
      updatedAt: now,
      ...args,
    };
    setStore((current) => ({ ...current, goals: [...current.goals, record] }));
    return null;
  }

  async function toggleGoal(id: string, completed: boolean) {
    setStore((current) => ({
      ...current,
      goals: current.goals.map((g) =>
        g._id === id ? { ...g, completed, updatedAt: Date.now() } : g,
      ),
    }));
  }

  async function removeGoal(id: string) {
    setStore((current) => ({
      ...current,
      goals: current.goals.filter((g) => g._id !== id),
    }));
  }

  async function createMeasurement(args: SaveMeasurementArgs) {
    const record: BodyMeasurementRecord = {
      _id: createLocalId("measurement"),
      createdAt: Date.now(),
      ...args,
    };
    setStore((current) => ({
      ...current,
      measurements: [...current.measurements, record],
    }));
    return null;
  }

  async function removeMeasurement(id: string) {
    setStore((current) => ({
      ...current,
      measurements: current.measurements.filter((m) => m._id !== id),
    }));
  }

  async function createProgram(args: SaveProgramArgs) {
    const record: ProgramRecord = {
      _id: createLocalId("program"),
      createdAt: Date.now(),
      ...args,
    };
    setStore((current) => ({ ...current, programs: [...current.programs, record] }));
    return null;
  }

  async function removeProgram(id: string) {
    setStore((current) => ({
      ...current,
      programs: current.programs.filter((p) => p._id !== id),
      programExercises: current.programExercises.filter((ex) => ex.programId !== id),
    }));
  }

  async function addProgramExercise(args: SaveProgramExerciseArgs) {
    setStore((current) => {
      const existing = current.programExercises.filter(
        (ex) => ex.programId === args.programId,
      );
      const record: ProgramExerciseRecord = {
        _id: createLocalId("program-ex"),
        order: existing.length,
        ...args,
      };
      return {
        ...current,
        programExercises: [...current.programExercises, record],
      };
    });
    return null;
  }

  async function removeProgramExercise(id: string) {
    setStore((current) => ({
      ...current,
      programExercises: current.programExercises.filter((ex) => ex._id !== id),
    }));
  }

  async function createSport(args: SaveSportArgs) {
    const record: SportSessionRecord = {
      _id: createLocalId("sport"),
      createdAt: Date.now(),
      ...args,
    };
    setStore((current) => ({ ...current, sports: [...current.sports, record] }));
    return null;
  }

  async function removeSport(id: string) {
    setStore((current) => ({
      ...current,
      sports: current.sports.filter((s) => s._id !== id),
    }));
  }

  async function createStudy(args: SaveStudyArgs) {
    const record: StudySessionRecord = {
      _id: createLocalId("study"),
      createdAt: Date.now(),
      ...args,
    };
    setStore((current) => ({ ...current, studies: [...current.studies, record] }));
    return null;
  }

  async function removeStudy(id: string) {
    setStore((current) => ({
      ...current,
      studies: current.studies.filter((s) => s._id !== id),
    }));
  }

  async function createPlan(args: SavePlanArgs) {
    const now = Date.now();
    const record: PlanItemRecord = {
      _id: createLocalId("plan"),
      completed: false,
      createdAt: now,
      updatedAt: now,
      ...args,
    };
    setStore((current) => ({ ...current, plans: [...current.plans, record] }));
    return null;
  }

  async function togglePlan(id: string, completed: boolean) {
    setStore((current) => ({
      ...current,
      plans: current.plans.map((p) =>
        p._id === id ? { ...p, completed, updatedAt: Date.now() } : p,
      ),
    }));
  }

  async function removePlan(id: string) {
    setStore((current) => ({
      ...current,
      plans: current.plans.filter((p) => p._id !== id),
    }));
  }

  return {
    mode: "browser",
    dashboard,
    checkins: store.checkins,
    workoutLogs: store.workoutLogs,
    exercises: [...store.exercises].sort((a, b) => a.name.localeCompare(b.name)),
    goals: [...store.goals].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.createdAt - a.createdAt;
    }),
    measurements: [...store.measurements].sort((a, b) =>
      b.dateKey.localeCompare(a.dateKey),
    ),
    programs,
    sports: [...store.sports].sort((a, b) => {
      if (b.dateKey !== a.dateKey) return b.dateKey.localeCompare(a.dateKey);
      return b.createdAt - a.createdAt;
    }),
    studies: [...store.studies].sort((a, b) => {
      if (b.dateKey !== a.dateKey) return b.dateKey.localeCompare(a.dateKey);
      return b.createdAt - a.createdAt;
    }),
    plans: [...store.plans].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (b.dateKey !== a.dateKey) return b.dateKey.localeCompare(a.dateKey);
      return b.createdAt - a.createdAt;
    }),
    actions: {
      saveCheckin,
      createWorkout,
      removeWorkout,
      createExercise,
      removeExercise,
      createGoal,
      toggleGoal,
      removeGoal,
      createMeasurement,
      removeMeasurement,
      createProgram,
      removeProgram,
      addProgramExercise,
      removeProgramExercise,
      createSport,
      removeSport,
      createStudy,
      removeStudy,
      createPlan,
      togglePlan,
      removePlan,
    },
  };
}
