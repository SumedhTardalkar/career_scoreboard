import { NextResponse } from "next/server";
import { db } from "@/db";
import { healthCheckins } from "@/db/schema";
import { eq } from "drizzle-orm";

const HEALTH_POINTS = {
  lost_weight: 2,
  maintained_gained_muscle: 1,
  gained_gained_muscle: 1,
  maintained: 0.5,
  gained_weight: 0,
  gained_weight_lost_muscle: -1,
} as const;

type HealthOutcome = keyof typeof HEALTH_POINTS;

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();

  const daysSinceMonday = day === 0 ? 6 : day - 1;

  const monday = new Date(now);
  monday.setDate(now.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const date = String(monday.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

export async function GET() {
  const week = getWeekStart();

  const result = await db
    .select()
    .from(healthCheckins)
    .where(eq(healthCheckins.week, week))
    .limit(1);

  const checkin = result[0] ?? null;

  return NextResponse.json({
    week,
    checkin,
    points: checkin
      ? HEALTH_POINTS[
          checkin.outcome as HealthOutcome
        ]
      : 0,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      outcome,
      weightGrams,
      muscleMassGrams,
      notes,
    } = body as {
      outcome?: HealthOutcome;
      weightGrams?: number | null;
      muscleMassGrams?: number | null;
      notes?: string | null;
    };

    if (!outcome || !(outcome in HEALTH_POINTS)) {
      return NextResponse.json(
        {
          error: "Invalid health outcome.",
        },
        { status: 400 }
      );
    }

    const week = getWeekStart();

    const existing = await db
      .select()
      .from(healthCheckins)
      .where(eq(healthCheckins.week, week))
      .limit(1);

    let checkin;

    const values = {
      week,
      outcome,
      weightGrams: weightGrams ?? null,
      muscleMassGrams: muscleMassGrams ?? null,
      notes: notes ?? null,
    };

    if (existing.length > 0) {
      checkin = await db
        .update(healthCheckins)
        .set({
          outcome,
          weightGrams: weightGrams ?? null,
          muscleMassGrams: muscleMassGrams ?? null,
          notes: notes ?? null,
        })
        .where(eq(healthCheckins.week, week))
        .returning();
    } else {
      checkin = await db
        .insert(healthCheckins)
        .values(values)
        .returning();
    }

    return NextResponse.json({
      ...checkin[0],
      points: HEALTH_POINTS[outcome],
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to save health check-in.",
      },
      { status: 500 }
    );
  }
}
