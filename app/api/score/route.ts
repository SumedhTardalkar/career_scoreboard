import { db } from "@/db";
import { activities } from "@/db/schema";
import { SCORE_RULES } from "@/lib/scoring";
import { NextResponse } from "next/server";

export async function GET() {
  const allActivities = await db.select().from(activities);

  const today = new Date().toISOString().split("T")[0];

  const todayActivities = allActivities.filter(
    (activity) => activity.date === today
  );

  const categories = Object.keys(SCORE_RULES) as Array<
    keyof typeof SCORE_RULES
  >;

  const breakdown = categories.map((category) => {
    const rule = SCORE_RULES[category];

    const categoryActivities = todayActivities.filter(
      (activity) => activity.category === category
    );

    let actual = 0;

    if (rule.metric === "duration") {
      actual = categoryActivities.reduce(
        (total, activity) => total + (activity.durationMinutes ?? 0),
        0
      );
    }

    if (rule.metric === "quantity") {
      actual = categoryActivities.reduce(
        (total, activity) => total + (activity.quantity ?? 0),
        0
      );
    }

    if (rule.metric === "activities") {
      actual = categoryActivities.length;
    }

    const progress = Math.min(actual / rule.target, 1);

    return {
      category,
      actual,
      target: rule.target,
      weight: rule.weight,
      points: progress * rule.weight,
    };
  });

  const score = breakdown.reduce(
    (total, category) => total + category.points,
    0
  );

  return NextResponse.json({
    date: today,
    score,
    breakdown,
  });
}
