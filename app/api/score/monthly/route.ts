import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  activities,
  healthCheckins,
} from "@/db/schema";
import {
  and,
  gte,
  lte,
} from "drizzle-orm";
import {
  calculateCategoryProgress,
  SCORE_RULES,
} from "@/lib/scoring";

const HEALTH_POINTS = {
  lost_weight: 2,
  maintained_gained_muscle: 1,
  gained_gained_muscle: 1,
  maintained: 0.5,
  gained_weight: 0,
  gained_weight_lost_muscle: -1,
} as const;

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthRange() {
  const now = new Date();

  const firstDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const lastDay = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  );

  return {
    startDate: formatDate(firstDay),
    endDate: formatDate(lastDay),
  };
}

export async function GET() {
  const {
    startDate,
    endDate,
  } = getMonthRange();

  const [activityRows, healthRows] =
    await Promise.all([
      db
        .select()
        .from(activities)
        .where(
          and(
            gte(
              activities.date,
              startDate
            ),
            lte(
              activities.date,
              endDate
            )
          )
        ),

      db
        .select()
        .from(healthCheckins),
    ]);

  const breakdown = Object.entries(
    SCORE_RULES
  ).map(([category, rule]) => {
    if (category === "health") {
      const relevantHealth =
        healthRows.filter((checkin) => {
          return (
            checkin.week >= startDate &&
            checkin.week <= endDate
          );
        });

      const rawHealthPoints =
        relevantHealth.reduce(
          (total, checkin) => {
            return (
              total +
              HEALTH_POINTS[
                checkin.outcome as keyof typeof HEALTH_POINTS
              ]
            );
          },
          0
        );

      /*
       * A month can contain multiple weekly
       * health check-ins.
       *
       * Each week can contribute up to 2 raw
       * health points.
       */
      const maximumHealthPoints =
        relevantHealth.length * 2;

      const healthProgress =
        maximumHealthPoints === 0
          ? 0
          : Math.min(
              Math.max(
                rawHealthPoints /
                  maximumHealthPoints,
                0
              ),
              1
            );

      const weightedPoints =
        healthProgress * rule.weight;

      return {
        category,
        actual: rawHealthPoints,
        target: maximumHealthPoints || 2,
        weight: rule.weight,
        points: Number(
          weightedPoints.toFixed(2)
        ),
      };
    }

    const categoryActivities =
      activityRows.filter(
        (activity) =>
          activity.category === category
      );

    let actual = 0;

    if (rule.metric === "duration") {
      actual =
        categoryActivities.reduce(
          (total, activity) =>
            total +
            (activity.durationMinutes ?? 0),
          0
        );
    }

    if (rule.metric === "quantity") {
      actual =
        categoryActivities.reduce(
          (total, activity) =>
            total +
            (activity.quantity ?? 0),
          0
        );
    }

    if (rule.metric === "activities") {
      actual = categoryActivities.length;
    }

    /*
     * Monthly targets are scaled by the number
     * of days elapsed in the month.
     *
     * This prevents September 1 from being
     * compared against the entire month's target.
     */
    const now = new Date();

    const daysElapsed =
      now.getDate();

    const daysInMonth =
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();

    const monthlyTarget =
      rule.target *
      (daysElapsed / daysInMonth);

    const result =
      calculateCategoryProgress(
        category as keyof typeof SCORE_RULES,
        actual
      );

    const progress =
      monthlyTarget === 0
        ? 0
        : Math.min(
            actual / monthlyTarget,
            1
          );

    return {
      category,
      actual,
      target: Number(
        monthlyTarget.toFixed(2)
      ),
      weight: rule.weight,
      points: Number(
        (progress * rule.weight).toFixed(2)
      ),
    };
  });

  const score =
    breakdown.reduce(
      (total, item) =>
        total + item.points,
      0
    );

  return NextResponse.json({
    startDate,
    endDate,
    score: Number(
      score.toFixed(2)
    ),
    breakdown,
  });
}
