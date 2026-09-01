import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  activities,
  categories,
  healthCheckins,
} from "@/db/schema";
import {
  and,
  gte,
  lte,
  eq,
} from "drizzle-orm";
import {
  calculateCategoryProgress,
  HEALTH_POINTS,
} from "@/lib/scoring";

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

  const [
    categoryRows,
    activityRows,
    healthRows,
  ] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(eq(categories.archived, false)),

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

  const activeCategories =
    categoryRows.filter(
      (category) =>
        !category.archived
    );

  const breakdown =
    activeCategories.map(
      (category) => {
        if (
          category.inputType ===
          "health"
        ) {
          const relevantHealth =
            healthRows.filter(
              (checkin) =>
                checkin.week >=
                  startDate &&
                checkin.week <=
                  endDate
            );

          const rawHealthPoints =
            relevantHealth.reduce(
              (total, checkin) =>
                total +
                HEALTH_POINTS[
                  checkin
                    .outcome as keyof typeof HEALTH_POINTS
                ],
              0
            );

          const maximumHealthPoints =
            relevantHealth.length * 2;

          const progress =
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

          return {
            category:
              category.slug,
            name: category.name,
            unit: category.unit,
            inputType:
              category.inputType,
            actual:
              rawHealthPoints,
            target:
              maximumHealthPoints || 2,
            weight:
              category.weight,
            points:
              Number(
                (
                  progress *
                  category.weight
                ).toFixed(2)
              ),
          };
        }

        const categoryActivities =
          activityRows.filter(
            (activity) =>
              activity.categoryId ===
              category.id
          );

        let actual = 0;

        if (
          category.inputType ===
          "duration"
        ) {
          actual =
            categoryActivities.reduce(
              (total, activity) =>
                total +
                (activity.durationMinutes ??
                  0),
              0
            );
        }

        if (
          category.inputType ===
          "quantity"
        ) {
          actual =
            categoryActivities.reduce(
              (total, activity) =>
                total +
                (activity.quantity ?? 0),
              0
            );
        }

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
          category.target *
          (daysElapsed /
            daysInMonth);

        const result =
          calculateCategoryProgress(
            actual,
            monthlyTarget,
            category.weight
          );

        return {
          category:
            category.slug,
          name: category.name,
          unit: category.unit,
          inputType:
            category.inputType,
          actual,
          target: Number(
            monthlyTarget.toFixed(2)
          ),
          weight:
            category.weight,
          points: Number(
            result.points.toFixed(2)
          ),
        };
      }
    );

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
