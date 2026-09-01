import { db } from "@/db";
import { activities } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await db
    .select()
    .from(activities)
    .orderBy(desc(activities.date), desc(activities.createdAt));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();

  const {
    date,
    category,
    title,
    durationMinutes,
    quantity,
    notes,
  } = body;

  if (!date || !category || !title) {
    return NextResponse.json(
      { error: "date, category and title are required" },
      { status: 400 }
    );
  }

  const result = await db
    .insert(activities)
    .values({
      date,
      category,
      title,
      durationMinutes: durationMinutes ?? null,
      quantity: quantity ?? null,
      notes: notes ?? null,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
