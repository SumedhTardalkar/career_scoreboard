"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";

type InputType =
  | "duration"
  | "quantity";

type Category = {
  id: number;
  name: string;
  slug: string;
  inputType: InputType;
  unit: string;
  target: number;
  weight: number;
  archived: boolean;
  createdAt: string;
};

type CategoryForm = {
  name: string;
  slug: string;
  inputType: InputType;
  unit: string;
  target: string;
  weight: string;
};

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  inputType: "duration",
  unit: "",
  target: "",
  weight: "5",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoriesPage() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [form, setForm] =
    useState<CategoryForm>(emptyForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [showArchived, setShowArchived] =
    useState(false);

  async function fetchCategories(): Promise<
    Category[]
  > {
      const response = await fetch(
      "/api/categories?archived=all",
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load categories: ${response.status}`
      );
    }

    return response.json();
  }

  useEffect(() => {
    let cancelled = false;

    fetchCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories(data);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(
            "Failed to load categories:",
            error
          );

          setMessage(
            "Unable to load categories."
          );

          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function updateForm(
    field: keyof CategoryForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug:
        editingId === null
          ? slugify(value)
          : current.slug,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEditing(
    category: Category
  ) {
    setEditingId(category.id);

    setForm({
      name: category.name,
      slug: category.slug,
      inputType: category.inputType,
      unit: category.unit,
      target: String(category.target),
      weight: String(category.weight),
    });

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const target = Number(
        form.target
      );

      const weight = Number(
        form.weight
      );

      if (!form.name.trim()) {
        setMessage(
          "Name is required."
        );
        return;
      }

      if (!form.slug.trim()) {
        setMessage(
          "Slug is required."
        );
        return;
      }

      if (!form.unit.trim()) {
        setMessage(
          "Unit is required."
        );
        return;
      }

      if (
        !Number.isInteger(target) ||
        target <= 0
      ) {
        setMessage(
          "Target must be a positive integer."
        );
        return;
      }

      if (
        !Number.isInteger(weight) ||
        weight < 1 ||
        weight > 10
      ) {
        setMessage(
          "Weight must be an integer between 1 and 10."
        );
        return;
      }

      const body = {
        name: form.name.trim(),
        slug: form.slug
          .trim()
          .toLowerCase(),
        inputType: form.inputType,
        unit: form.unit.trim(),
        target,
        weight,
      };

      const url =
        editingId === null
          ? "/api/categories"
          : `/api/categories/${editingId}`;

      const method =
        editingId === null
          ? "POST"
          : "PATCH";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data =
        await response.json().catch(
          () => null
        );

      if (!response.ok) {
        setMessage(
          data?.error ??
            "Unable to save category."
        );
        return;
      }

      const refreshed =
        await fetchCategories();

      setCategories(refreshed);

      setMessage(
        editingId === null
          ? "Category created ✓"
          : "Category updated ✓"
      );

      resetForm();
    } catch (error) {
      console.error(
        "Failed to save category:",
        error
      );

      setMessage(
        "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(
    category: Category
  ) {
    setMessage("");

    try {
      const response = await fetch(
        `/api/categories/${category.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            archived: true,
          }),
        }
      );

      const data =
        await response.json().catch(
          () => null
        );

      if (!response.ok) {
        setMessage(
          data?.error ??
            "Unable to archive category."
        );
        return;
      }

      const refreshed =
        await fetchCategories();

      setCategories(refreshed);

      if (
        editingId === category.id
      ) {
        resetForm();
      }

      setMessage(
        `"${category.name}" archived.`
      );
    } catch (error) {
      console.error(
        "Failed to archive category:",
        error
      );

      setMessage(
        "Unable to archive category."
      );
    }
  }

  async function handleRestore(
    category: Category
  ) {
    setMessage("");

    try {
      const response = await fetch(
        `/api/categories/${category.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            archived: false,
          }),
        }
      );

      const data =
        await response.json().catch(
          () => null
        );

      if (!response.ok) {
        setMessage(
          data?.error ??
            "Unable to restore category."
        );
        return;
      }

      const refreshed =
        await fetchCategories();

      setCategories(refreshed);

      setMessage(
        `"${category.name}" restored ✓`
      );
    } catch (error) {
      console.error(
        "Failed to restore category:",
        error
      );

      setMessage(
        "Unable to restore category."
      );
    }
  }

  async function handleDelete(
  category: Category
) {
  const confirmed = window.confirm(
    `Permanently delete "${category.name}"?\n\nThis cannot be undone.`
  );

  if (!confirmed) {
    return;
  }

  setMessage("");

  try {
    const response = await fetch(
      `/api/categories/${category.id}`,
      {
        method: "DELETE",
      }
    );

    const data =
      await response.json().catch(
        () => null
      );

    if (!response.ok) {
      setMessage(
        data?.error ??
          "Unable to permanently delete category."
      );
      return;
    }

    const refreshed =
      await fetchCategories();

    setCategories(refreshed);

    if (
      editingId === category.id
    ) {
      resetForm();
    }

    setMessage(
      `"${category.name}" permanently deleted.`
    );
  } catch (error) {
    console.error(
      "Failed to permanently delete category:",
      error
    );

    setMessage(
      "Unable to permanently delete category."
    );
  }
}


  const activeCategories =
    categories.filter(
      (category) =>
        !category.archived
    );

  const archivedCategories =
    categories.filter(
      (category) =>
        category.archived
    );

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-blue-400">
              Life Maxing
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Categories
            </h1>

            <p className="mt-2 text-zinc-400">
              Configure what you measure and
              how much it matters.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium transition hover:bg-zinc-700"
          >
            Back to Dashboard
          </Link>
        </header>

        {/* CATEGORY FORM */}
        <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {editingId === null
                  ? "Create Category"
                  : "Edit Category"}
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Daily activities are scored
                against these settings.
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-zinc-500 transition hover:text-white"
              >
                Cancel edit
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-5 md:grid-cols-2"
          >
            {/* NAME */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                Name
              </label>

              <input
                value={form.name}
                onChange={(event) =>
                  handleNameChange(
                    event.target.value
                  )
                }
                placeholder="Deep Work"
                className="w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* SLUG */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                Slug
              </label>

              <input
                value={form.slug}
                onChange={(event) =>
                  updateForm(
                    "slug",
                    event.target.value
                  )
                }
                placeholder="deep-work"
                className="w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* INPUT TYPE */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                Input Type
              </label>

              <select
                value={form.inputType}
                onChange={(event) =>
                  updateForm(
                    "inputType",
                    event.target
                      .value as InputType
                  )
                }
                className="w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="duration">
                  Duration
                </option>

                <option value="quantity">
                  Quantity
                </option>
              </select>
            </div>

            {/* UNIT */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                Unit
              </label>

              <input
                value={form.unit}
                onChange={(event) =>
                  updateForm(
                    "unit",
                    event.target.value
                  )
                }
                placeholder={
                  form.inputType ===
                  "duration"
                    ? "minutes"
                    : "reps"
                }
                className="w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* TARGET */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                Daily Target
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={form.target}
                onChange={(event) =>
                  updateForm(
                    "target",
                    event.target.value
                  )
                }
                placeholder="60"
                className="w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* WEIGHT */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                Weight
              </label>

              <input
                type="number"
                min="1"
                max="10"
                step="1"
                value={form.weight}
                onChange={(event) =>
                  updateForm(
                    "weight",
                    event.target.value
                  )
                }
                className="w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <p className="mt-2 text-xs text-zinc-600">
                1–10. Higher weight means
                greater contribution to the
                overall score.
              </p>
            </div>

            {/* SUBMIT */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 p-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "SAVING..."
                  : editingId === null
                    ? "CREATE CATEGORY"
                    : "SAVE CHANGES"}
              </button>
            </div>
          </form>

          {message && (
            <p
              className={`mt-4 text-center text-sm ${
                message.includes("Unable") ||
                message.includes(
                  "required"
                ) ||
                message.includes("must")
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {message}
            </p>
          )}
        </section>

        {/* ACTIVE CATEGORIES */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Active Categories
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                These categories appear when
                logging activities.
              </p>
            </div>

            <span className="text-sm text-zinc-500">
              {activeCategories.length}{" "}
              {activeCategories.length ===
              1
                ? "category"
                : "categories"}
            </span>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-zinc-500">
              Loading categories...
            </p>
          ) : activeCategories.length ===
            0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-zinc-700 p-6 text-center">
              <p className="text-sm text-zinc-400">
                No active categories.
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                Create one above or restore
                an archived category.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {activeCategories.map(
                (category) => (
                  <div
                    key={category.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">
                            {category.name}
                          </h3>

                          <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                            Weight{" "}
                            {category.weight}/10
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-zinc-500">
                          Target:{" "}
                          <span className="text-zinc-300">
                            {category.target}{" "}
                            {category.unit}
                          </span>
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          {category.slug} ·{" "}
                          {category.inputType}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(
                              category
                            )
                          }
                          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium transition hover:bg-zinc-700"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleArchive(
                              category
                            )
                          }
                          className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* ARCHIVED CATEGORIES */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <button
            type="button"
            onClick={() =>
              setShowArchived(
                (current) => !current
              )
            }
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <h2 className="text-lg font-semibold">
                Archived Categories
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Archived categories are hidden
                from daily activity logging but
                can always be restored.
              </p>
            </div>

            <span className="text-sm text-zinc-500">
              {showArchived
                ? "Hide"
                : "Show"}{" "}
              ({archivedCategories.length})
            </span>
          </button>

          {showArchived && (
            <div className="mt-6">
              {archivedCategories.length ===
              0 ? (
                <p className="text-sm text-zinc-600">
                  No archived categories.
                </p>
              ) : (
                <div className="space-y-3">
                  {archivedCategories.map(
                    (category) => (
                      <div
                        key={category.id}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 opacity-75"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">
                                {category.name}
                              </h3>

                              <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-500">
                                Archived
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-zinc-500">
                              Target:{" "}
                              <span className="text-zinc-300">
                                {
                                  category.target
                                }{" "}
                                {
                                  category.unit
                                }
                              </span>
                            </p>

                            <p className="mt-1 text-xs text-zinc-600">
                              {
                                category.slug
                              }{" "}
                              ·{" "}
                              {
                                category.inputType
                              }{" "}
                              · Weight{" "}
                              {
                                category.weight
                              }
                              /10
                            </p>
                          </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  startEditing(category)
                                }
                                className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium transition hover:bg-zinc-700"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRestore(category)
                                }
                                className="rounded-lg bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 transition hover:bg-green-500/20"
                              >
                                Restore
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(category)
                                }
                                className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
                              >
                                Delete
                              </button>
                            </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
