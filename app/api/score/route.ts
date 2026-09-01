import { NextResponse } from "next/server";
import { db } from "@/db";
import { activities, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateCategoryProgress } from "@/lib/scoring";

export async function GET() {
  const [categoryRows, activityRows] =
    await Promise.all([
      db
        .select()
        .from(categories)
        .where(eq(categories.archived, false)),

      db
        .select()
        .from(activities),
    ]);

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const todayActivities =
    activityRows.filter(
      (activity) =>
        activity.date === today
    );

  const breakdown =
    categoryRows.map((category) => {
      const categoryActivities =
        todayActivities.filter(
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

      const result =
        calculateCategoryProgress(
          actual,
          category.target,
          category.weight
        );

      return {
        category: category.slug,
        name: category.name,
        unit: category.unit,
        inputType: category.inputType,
        actual,
        target: category.target,
        weight: category.weight,
        points: result.points,
      };
    });

  const score =
    breakdown.reduce(
      (total, category) =>
        total + category.points,
      0
    );

  return NextResponse.json({
    date: today,
    score: Number(
      score.toFixed(2)
    ),
    breakdown,
  });
}
