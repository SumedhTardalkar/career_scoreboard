import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const INPUT_TYPES = ["duration", "quantity"] as const;

type InputType = (typeof INPUT_TYPES)[number];

function isInputType(
  value: unknown
): value is InputType {
  return (
    typeof value === "string" &&
    INPUT_TYPES.includes(
      value as InputType
    )
  );
}

export async function GET(
  request: Request
) {
  const { searchParams } =
    new URL(request.url);

  const archivedParam =
    searchParams.get("archived");

  const query = db
    .select()
    .from(categories);

  let result;

  if (archivedParam === "all") {
    result = await query.orderBy(
      asc(categories.createdAt)
    );
  } else {
    const archived =
      archivedParam === "true";

    result = await query
      .where(
        eq(
          categories.archived,
          archived
        )
      )
      .orderBy(
        asc(categories.createdAt)
      );
  }

  return NextResponse.json(result);
}

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const {
      name,
      slug,
      inputType,
      unit,
      target,
      weight,
    } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof slug !== "string" ||
      !slug.trim() ||
      !isInputType(inputType) ||
      typeof unit !== "string" ||
      !unit.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "name, slug, inputType and unit are required.",
        },
        { status: 400 }
      );
    }

    if (
      typeof target !== "number" ||
      !Number.isInteger(target) ||
      target <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "target must be a positive integer.",
        },
        { status: 400 }
      );
    }

    if (
      typeof weight !== "number" ||
      !Number.isInteger(weight) ||
      weight < 1 ||
      weight > 10
    ) {
      return NextResponse.json(
        {
          error:
            "weight must be an integer between 1 and 10.",
        },
        { status: 400 }
      );
    }

    const normalizedSlug = slug
      .trim()
      .toLowerCase();

    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        eq(
          categories.slug,
          normalizedSlug
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          error:
            "A category with this slug already exists.",
        },
        { status: 409 }
      );
    }

    const result = await db
      .insert(categories)
      .values({
        name: name.trim(),
        slug: normalizedSlug,
        inputType,
        unit: unit.trim(),
        target,
        weight,
        archived: false,
      })
      .returning();

    return NextResponse.json(
      result[0],
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to create category:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create category.",
      },
      { status: 500 }
    );
  }
}
