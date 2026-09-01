import { NextResponse } from "next/server";
import { db } from "@/db";
import { activities, healthCheckins } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { calculateCategoryProgress, SCORE_RULES } from "@/lib/scoring";

function getWeekRange() {
  const now = new Date();

  const currentDay = now.getDay();

  const daysSinceMonday =
    currentDay === 0 ? 6 : currentDay - 1;

  const monday = new Date(now);
  monday.setDate(now.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  return {
    monday,
    sunday,
    startDate: formatDate(monday),
    endDate: formatDate(sunday),
  };
}

const HEALTH_POINTS = {
  lost_weight: 2,
  maintained_gained_muscle: 1,
  gained_gained_muscle: 1,
  maintained: 0.5,
  gained_weight: 0,
  gained_weight_lost_muscle: -1,
} as const;

export async function GET() {
  const { startDate, endDate } = getWeekRange();

  const [activityRows, healthRows] = await Promise.all([
    db
      .select()
      .from(activities)
      .where(
        and(
          gte(activities.date, startDate),
          lte(activities.date, endDate)
        )
      ),

    db
      .select()
      .from(healthCheckins)
      .where(eq(healthCheckins.week, startDate))
      .limit(1),
  ]);

  const healthCheckin = healthRows[0] ?? null;

  const breakdown = Object.entries(SCORE_RULES).map(
    ([category, rule]) => {
      // Health is calculated from the weekly health check-in,
      // not from normal activities.
      if (category === "health") {
        const rawPoints = healthCheckin
            ? HEALTH_POINTS[
                healthCheckin.outcome as keyof typeof HEALTH_POINTS
            ]
            : 0;

        const healthProgress = Math.min(
            Math.max(rawPoints / 2, 0),
            1
        );

        const weightedPoints =
            healthProgress * rule.weight;

        return {
            category,
            actual: rawPoints,
            target: 2,
            weight: rule.weight,
            points: Number(weightedPoints.toFixed(2)),
        };
    }



      const categoryActivities = activityRows.filter(
        (activity) => activity.category === category
      );

      let actual = 0;

      if (rule.metric === "duration") {
        actual = categoryActivities.reduce(
          (total, activity) =>
            total + (activity.durationMinutes ?? 0),
          0
        );
      }

      if (rule.metric === "quantity") {
        actual = categoryActivities.reduce(
          (total, activity) =>
            total + (activity.quantity ?? 0),
          0
        );
      }

      if (rule.metric === "activities") {
        actual = categoryActivities.length;
      }

      const result = calculateCategoryProgress(
        category as keyof typeof SCORE_RULES,
        actual
      );

      return {
        category,
        actual,
        target: rule.target,
        weight: rule.weight,
        points: result.points,
      };
    }
  );

  const score = breakdown.reduce(
    (total, item) => total + item.points,
    0
  );

  return NextResponse.json({
    startDate,
    endDate,
    score: Number(score.toFixed(2)),
    breakdown,
  });
}
