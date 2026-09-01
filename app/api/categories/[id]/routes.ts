import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const INPUT_TYPES = ["duration", "quantity", "health"] as const;

type InputType = (typeof INPUT_TYPES)[number];

function isInputType(value: unknown): value is InputType {
  return (
    typeof value === "string" &&
    INPUT_TYPES.includes(value as InputType)
  );
}

function parseId(value: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "Invalid category id." },
      { status: 400 }
    );
  }

  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json(
      { error: "Category not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(result[0]);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = parseId(rawId);

    if (id === null) {
      return NextResponse.json(
        { error: "Invalid category id." },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }

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
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      return NextResponse.json(
        { error: "name must be a non-empty string." },
        { status: 400 }
      );
    }

    if (
      slug !== undefined &&
      (typeof slug !== "string" || !slug.trim())
    ) {
      return NextResponse.json(
        { error: "slug must be a non-empty string." },
        { status: 400 }
      );
    }

    if (
      inputType !== undefined &&
      !isInputType(inputType)
    ) {
      return NextResponse.json(
        { error: "Invalid inputType." },
        { status: 400 }
      );
    }

    if (
      unit !== undefined &&
      (typeof unit !== "string" || !unit.trim())
    ) {
      return NextResponse.json(
        { error: "unit must be a non-empty string." },
        { status: 400 }
      );
    }

    if (
      target !== undefined &&
      (
        typeof target !== "number" ||
        !Number.isInteger(target) ||
        target <= 0
      )
    ) {
      return NextResponse.json(
        {
          error: "target must be a positive integer.",
        },
        { status: 400 }
      );
    }

    if (
      weight !== undefined &&
      (
        typeof weight !== "number" ||
        !Number.isInteger(weight) ||
        weight < 1 ||
        weight > 10
      )
    ) {
      return NextResponse.json(
        {
          error: "weight must be an integer between 1 and 10.",
        },
        { status: 400 }
      );
    }

    const normalizedSlug =
      slug !== undefined
        ? slug.trim().toLowerCase()
        : existing[0].slug;

    if (normalizedSlug !== existing[0].slug) {
      const duplicate = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, normalizedSlug))
        .limit(1);

      if (duplicate.length > 0) {
        return NextResponse.json(
          {
            error:
              "A category with this slug already exists.",
          },
          { status: 409 }
        );
      }
    }

    const result = await db
      .update(categories)
      .set({
        ...(name !== undefined && {
          name: name.trim(),
        }),
        ...(slug !== undefined && {
          slug: normalizedSlug,
        }),
        ...(inputType !== undefined && {
          inputType,
        }),
        ...(unit !== undefined && {
          unit: unit.trim(),
        }),
        ...(target !== undefined && {
          target,
        }),
        ...(weight !== undefined && {
          weight,
        }),
      })
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error(
      "Failed to update category:",
      error
    );

    return NextResponse.json(
      { error: "Unable to update category." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = parseId(rawId);

    if (id === null) {
      return NextResponse.json(
        { error: "Invalid category id." },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }

    if (existing[0].archived) {
      return NextResponse.json(
        { error: "Category is already archived." },
        { status: 409 }
      );
    }

    const result = await db
      .update(categories)
      .set({
        archived: true,
      })
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error(
      "Failed to archive category:",
      error
    );

    return NextResponse.json(
      { error: "Unable to archive category." },
      { status: 500 }
    );
  }
}
