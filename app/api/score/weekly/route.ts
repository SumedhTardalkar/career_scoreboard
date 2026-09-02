import { NextResponse } from "next/server";
import { db } from "@/db";
import { activities, categories } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import {
  calculateCategoryProgress,
  calculateWeightedPoints,
} from "@/lib/scoring";

function getWeekRange() {
  const now = new Date();

  const currentDay = now.getDay();

  const daysSinceMonday =
    currentDay === 0 ? 6 : currentDay - 1;

  const monday = new Date(now);

  monday.setDate(
    now.getDate() - daysSinceMonday
  );

  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);

  sunday.setDate(
    monday.getDate() + 6
  );

  sunday.setHours(
    23,
    59,
    59,
    999
  );

  const formatDate = (date: Date) => {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(monday),
    endDate: formatDate(sunday),
  };
}

export async function GET() {
  const {
    startDate,
    endDate,
  } = getWeekRange();

  const [
    categoryRows,
    activityRows,
  ] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(
        eq(categories.archived, false)
      ),

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
  ]);

  const totalWeight =
    categoryRows.reduce(
      (total, category) =>
        total + category.weight,
      0
    );

  const breakdown =
    categoryRows.map((category) => {
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
              (activity.quantity ??
                0),
            0
          );
      }

      const progress =
        calculateCategoryProgress(
          actual,
          category.target,
          category.weight
        );

      const points =
        calculateWeightedPoints(
          progress.progress,
          category.weight,
          totalWeight
        );

      return {
        category: category.slug,
        name: category.name,
        unit: category.unit,
        inputType: category.inputType,
        actual,
        target: category.target,
        weight: category.weight,
        percentage:
          totalWeight === 0
            ? 0
            : (category.weight /
                totalWeight) *
              100,
        progress:
          progress.progress * 100,
        points,
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
    totalWeight,
    breakdown,
  });
}