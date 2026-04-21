import { anyApi } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import type {
  BodyMeasurementRecord,
  DashboardData,
  ExerciseRecord,
  GoalRecord,
  PlanItemRecord,
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
} from "./types";

export function useConvexTracker(selectedDateKey: string): TrackerBundle | null {
  const dashboard = useQuery(anyApi.dashboard.get, {
    dateKey: selectedDateKey,
  }) as DashboardData | undefined;

  const exercises = useQuery(anyApi.exercises.list, {}) as
    | ExerciseRecord[]
    | undefined;
  const goals = useQuery(anyApi.goals.list, {}) as GoalRecord[] | undefined;
  const measurements = useQuery(anyApi.bodyMeasurements.list, {}) as
    | BodyMeasurementRecord[]
    | undefined;
  const programs = useQuery(anyApi.programs.list, {}) as
    | ProgramWithExercises[]
    | undefined;
  const sports = useQuery(anyApi.sportSessions.list, {}) as
    | SportSessionRecord[]
    | undefined;
  const studies = useQuery(anyApi.studySessions.list, {}) as
    | StudySessionRecord[]
    | undefined;
  const plans = useQuery(anyApi.planItems.list, {}) as PlanItemRecord[] | undefined;

  const saveCheckin = useMutation(anyApi.checkins.upsert);
  const createWorkoutLog = useMutation(anyApi.workoutLogs.create);
  const removeWorkoutLog = useMutation(anyApi.workoutLogs.remove);
  const createExercise = useMutation(anyApi.exercises.create);
  const removeExercise = useMutation(anyApi.exercises.remove);
  const createGoal = useMutation(anyApi.goals.create);
  const toggleGoal = useMutation(anyApi.goals.toggle);
  const removeGoal = useMutation(anyApi.goals.remove);
  const createMeasurement = useMutation(anyApi.bodyMeasurements.create);
  const removeMeasurement = useMutation(anyApi.bodyMeasurements.remove);
  const createProgram = useMutation(anyApi.programs.create);
  const removeProgram = useMutation(anyApi.programs.remove);
  const addProgramExercise = useMutation(anyApi.programs.addExercise);
  const removeProgramExercise = useMutation(anyApi.programs.removeExercise);
  const createSport = useMutation(anyApi.sportSessions.create);
  const removeSport = useMutation(anyApi.sportSessions.remove);
  const createStudy = useMutation(anyApi.studySessions.create);
  const removeStudy = useMutation(anyApi.studySessions.remove);
  const createPlan = useMutation(anyApi.planItems.create);
  const togglePlan = useMutation(anyApi.planItems.toggle);
  const removePlan = useMutation(anyApi.planItems.remove);

  if (
    !dashboard ||
    !exercises ||
    !goals ||
    !measurements ||
    !programs ||
    !sports ||
    !studies ||
    !plans
  ) {
    return null;
  }

  return {
    mode: "convex",
    dashboard,
    checkins: dashboard.selectedCheckin ? [dashboard.selectedCheckin] : [],
    workoutLogs: dashboard.selectedLogs,
    exercises,
    goals,
    measurements,
    programs,
    sports,
    studies,
    plans,
    actions: {
      saveCheckin: (args: SaveCheckinArgs) => saveCheckin(args),
      createWorkout: (args: SaveWorkoutArgs) => createWorkoutLog(args),
      removeWorkout: async (id: string) => {
        await removeWorkoutLog({ id: id as never });
      },
      createExercise: (args: SaveExerciseArgs) => createExercise(args),
      removeExercise: async (id: string) => {
        await removeExercise({ id: id as never });
      },
      createGoal: (args: SaveGoalArgs) => createGoal(args),
      toggleGoal: async (id: string, completed: boolean) => {
        await toggleGoal({ id: id as never, completed });
      },
      removeGoal: async (id: string) => {
        await removeGoal({ id: id as never });
      },
      createMeasurement: (args: SaveMeasurementArgs) => createMeasurement(args),
      removeMeasurement: async (id: string) => {
        await removeMeasurement({ id: id as never });
      },
      createProgram: (args: SaveProgramArgs) => createProgram(args),
      removeProgram: async (id: string) => {
        await removeProgram({ id: id as never });
      },
      addProgramExercise: (args: SaveProgramExerciseArgs) =>
        addProgramExercise({ ...args, programId: args.programId as never }),
      removeProgramExercise: async (id: string) => {
        await removeProgramExercise({ id: id as never });
      },
      createSport: (args: SaveSportArgs) => createSport(args),
      removeSport: async (id: string) => {
        await removeSport({ id: id as never });
      },
      createStudy: (args: SaveStudyArgs) => createStudy(args),
      removeStudy: async (id: string) => {
        await removeStudy({ id: id as never });
      },
      createPlan: (args: SavePlanArgs) => createPlan(args),
      togglePlan: async (id: string, completed: boolean) => {
        await togglePlan({ id: id as never, completed });
      },
      removePlan: async (id: string) => {
        await removePlan({ id: id as never });
      },
    },
  };
}
