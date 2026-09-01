export type InputType =
  | "duration"
  | "quantity"
  | "health";

export const HEALTH_POINTS = {
  lost_weight: 2,
  maintained_gained_muscle: 1,
  gained_gained_muscle: 1,
  maintained: 0.5,
  gained_weight: 0,
  gained_weight_lost_muscle: -1,
} as const;

export type HealthOutcome =
  keyof typeof HEALTH_POINTS;

export function calculateCategoryProgress(
  actual: number,
  target: number,
  weight: number
) {
  if (target <= 0 || weight <= 0) {
    return {
      progress: 0,
      points: 0,
    };
  }

  const progress = Math.min(
    Math.max(actual / target, 0),
    1
  );

  return {
    progress,
    points: progress * weight,
  };
}

export function calculateWeightedPoints(
  progress: number,
  weight: number,
  totalWeight: number
) {
  if (
    totalWeight <= 0 ||
    weight <= 0
  ) {
    return 0;
  }

  const safeProgress = Math.min(
    Math.max(progress, 0),
    1
  );

  return (
    safeProgress *
    (weight / totalWeight) *
    100
  );
}


export function calculateHealthPoints(
  outcome: HealthOutcome
) {
  return HEALTH_POINTS[outcome];
}
