export type Category =
  | "coding"
  | "dsa"
  | "engineering"
  | "project"
  | "career"
  | "health";

export const SCORE_RULES = {
  coding: {
    target: 600,
    weight: 25,
    metric: "duration",
  },

  dsa: {
    target: 5,
    weight: 20,
    metric: "quantity",
  },

  engineering: {
    target: 3,
    weight: 15,
    metric: "activities",
  },

  project: {
    target: 300,
    weight: 15,
    metric: "duration",
  },

  career: {
    target: 5,
    weight: 10,
    metric: "quantity",
  },

  health: {
    target: 1,
    weight: 15,
    metric: "health",
  },
} as const;

export const HEALTH_POINTS = {
  lost_weight: 2,
  maintained_gained_muscle: 1,
  gained_gained_muscle: 1,
  maintained: 0.5,
  gained_weight: 0,
  gained_weight_lost_muscle: -1,
} as const;

export function calculateCategoryProgress(
  category: Category,
  actual: number
) {
  const rule = SCORE_RULES[category];

  const progress = Math.min(actual / rule.target, 1);

  return {
    progress,
    points: progress * rule.weight,
  };
}

export function calculateHealthPoints(
  outcome: keyof typeof HEALTH_POINTS
) {
  return HEALTH_POINTS[outcome];
}
