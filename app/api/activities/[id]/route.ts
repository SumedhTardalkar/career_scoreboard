import { db } from "@/db";
import {
  activities,
  categories,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

function parseId(value: string) {
  const id = Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return id;
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id: rawId } = await params;

    const id = parseId(rawId);

    if (id === null) {
      return NextResponse.json(
        {
          error: "Invalid activity id.",
        },
        { status: 400 }
      );
    }

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
          categories.id
        )
      )
      .where(
        eq(activities.id, id)
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        {
          error: "Activity not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      result[0]
    );
  } catch (error) {
    console.error(
      "Failed to fetch activity:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to fetch activity.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id: rawId } = await params;

    const id = parseId(rawId);

    if (id === null) {
      return NextResponse.json(
        {
          error: "Invalid activity id.",
        },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(activities)
      .where(
        eq(activities.id, id)
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          error: "Activity not found.",
        },
        { status: 404 }
      );
    }

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
      date !== undefined &&
      (
        typeof date !== "string" ||
        !date.trim()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "date must be a non-empty string.",
        },
        { status: 400 }
      );
    }

    if (
      categoryId !== undefined &&
      (
        typeof categoryId !== "number" ||
        !Number.isInteger(categoryId) ||
        categoryId <= 0
      )
    ) {
      return NextResponse.json(
        {
          error:
            "categoryId must be a positive integer.",
        },
        { status: 400 }
      );
    }

    if (
      title !== undefined &&
      (
        typeof title !== "string" ||
        !title.trim()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "title must be a non-empty string.",
        },
        { status: 400 }
      );
    }

    if (
      notes !== undefined &&
      notes !== null &&
      typeof notes !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "notes must be a string or null.",
        },
        { status: 400 }
      );
    }

    const nextCategoryId =
      categoryId !== undefined
        ? categoryId
        : existing[0].categoryId;

    const categoryResult =
      await db
        .select()
        .from(categories)
        .where(
          eq(
            categories.id,
            nextCategoryId
          )
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
        { status: 404 }
      );
    }

    if (category.archived) {
      return NextResponse.json(
        {
          error:
            "Cannot assign an activity to an archived category.",
        },
        { status: 400 }
      );
    }

    const nextDuration =
      durationMinutes !== undefined
        ? durationMinutes
        : existing[0]
            .durationMinutes;

    const nextQuantity =
      quantity !== undefined
        ? quantity
        : existing[0].quantity;

    if (
      category.inputType ===
      "duration"
    ) {
      if (
        typeof nextDuration !==
          "number" ||
        !Number.isInteger(
          nextDuration
        ) ||
        nextDuration <= 0
      ) {
        return NextResponse.json(
          {
            error: `A positive integer value in ${category.unit} is required.`,
          },
          { status: 400 }
        );
      }
    }

    if (
      category.inputType ===
      "quantity"
    ) {
      if (
        typeof nextQuantity !==
          "number" ||
        !Number.isInteger(
          nextQuantity
        ) ||
        nextQuantity <= 0
      ) {
        return NextResponse.json(
          {
            error: `A positive integer value in ${category.unit} is required.`,
          },
          { status: 400 }
        );
      }
    }

    const result =
      await db
        .update(activities)
        .set({
          ...(date !== undefined && {
            date: date.trim(),
          }),

          ...(categoryId !==
            undefined && {
            categoryId,
          }),

          ...(title !== undefined && {
            title: title.trim(),
          }),

          durationMinutes:
            category.inputType ===
            "duration"
              ? nextDuration
              : null,

          quantity:
            category.inputType ===
            "quantity"
              ? nextQuantity
              : null,

          notes:
            notes === undefined
              ? existing[0].notes
              : typeof notes ===
                    "string" &&
                  notes.trim()
                ? notes.trim()
                : null,
        })
        .where(
          eq(activities.id, id)
        )
        .returning();

    return NextResponse.json(
      result[0]
    );
  } catch (error) {
    console.error(
      "Failed to update activity:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update activity.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id: rawId } = await params;

    const id = parseId(rawId);

    if (id === null) {
      return NextResponse.json(
        {
          error: "Invalid activity id.",
        },
        { status: 400 }
      );
    }

    const existing = await db
      .select({
        id: activities.id,
      })
      .from(activities)
      .where(
        eq(activities.id, id)
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          error: "Activity not found.",
        },
        { status: 404 }
      );
    }

    const result =
      await db
        .delete(activities)
        .where(
          eq(activities.id, id)
        )
        .returning();

    return NextResponse.json(
      result[0]
    );
  } catch (error) {
    console.error(
      "Failed to delete activity:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete activity.",
      },
      { status: 500 }
    );
  }
}
