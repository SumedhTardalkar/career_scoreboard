export type InputType =
  | "duration"
  | "quantity"


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
