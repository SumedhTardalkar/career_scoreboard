import { db } from "@/db";
import {
  activities,
  categories,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await db
    .select({
      id: activities.id,
      date: activities.date,
      categoryId: activities.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryInputType:
        categories.inputType,
      categoryUnit: categories.unit,
      title: activities.title,
      durationMinutes:
        activities.durationMinutes,
      quantity: activities.quantity,
      notes: activities.notes,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .leftJoin(
      categories,
      eq(
        activities.categoryId,
        categories.id,
      ),
    )
    .orderBy(
      desc(activities.date),
      desc(activities.createdAt),
    );

  return NextResponse.json(result);
}

export async function POST(
  request: Request,
) {
  try {
    const body = await request.json();

    const {
      date,
      categoryId,
      title,
      durationMinutes,
      quantity,
      notes,
    } = body;

    if (
      typeof date !== "string" ||
      !date.trim() ||
      typeof categoryId !== "number" ||
      !Number.isInteger(categoryId) ||
      categoryId <= 0 ||
      typeof title !== "string" ||
      !title.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "date, categoryId and title are required.",
        },
        { status: 400 },
      );
    }

    const categoryResult =
      await db
        .select()
        .from(categories)
        .where(
          eq(
            categories.id,
            categoryId,
          ),
        )
        .limit(1);

    const category =
      categoryResult[0];

    if (!category) {
      return NextResponse.json(
        {
          error:
            "Category not found.",
        },
        { status: 404 },
      );
    }

    if (category.archived) {
      return NextResponse.json(
        {
          error:
            "Cannot log an activity against an archived category.",
        },
        { status: 400 },
      );
    }

    if (
      category.inputType ===
      "health"
    ) {
      return NextResponse.json(
        {
          error:
            "Health uses the dedicated health check-in flow.",
        },
        { status: 400 },
      );
    }

    let storedDuration:
      | number
      | null = null;

    let storedQuantity:
      | number
      | null = null;

    if (
      category.inputType ===
      "duration"
    ) {
      if (
        typeof durationMinutes !==
          "number" ||
        !Number.isInteger(
          durationMinutes,
        ) ||
        durationMinutes <= 0
      ) {
        return NextResponse.json(
          {
            error: `A positive integer value in ${category.unit} is required.`,
          },
          { status: 400 },
        );
      }

      storedDuration =
        durationMinutes;
    }

    if (
      category.inputType ===
      "quantity"
    ) {
      if (
        typeof quantity !==
          "number" ||
        !Number.isInteger(
          quantity,
        ) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          {
            error: `A positive integer value in ${category.unit} is required.`,
          },
          { status: 400 },
        );
      }

      storedQuantity = quantity;
    }

    const result =
      await db
        .insert(activities)
        .values({
          date: date.trim(),
          categoryId,
          title: title.trim(),
          durationMinutes:
            storedDuration,
          quantity:
            storedQuantity,
          notes:
            typeof notes ===
              "string" &&
            notes.trim()
              ? notes.trim()
              : null,
        })
        .returning();

    return NextResponse.json(
      result[0],
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Failed to create activity:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to create activity.",
      },
      { status: 500 },
    );
  }
}
