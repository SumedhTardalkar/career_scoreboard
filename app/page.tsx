"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";

import DashboardScoreboard from "@/components/DashboardScoreboard";

type Category = {
  id: number;
  name: string;
  slug: string;
  inputType: "duration" | "quantity";
  unit: string;
  target: number;
  weight: number;
  archived: boolean;
};

type Activity = {
  id: number;
  date: string;
  categoryId: number;
  categoryName: string | null;
  categorySlug: string | null;
  categoryInputType: "duration" | "quantity" | null;
  categoryUnit: string | null;
  title: string;
  durationMinutes: number | null;
  quantity: number | null;
  notes: string | null;
  createdAt: string;
};

type ScoreBreakdown = {
  category: string;
  actual: number;
  target: number;
  weight: number;
  points: number;
};

type ScoreResponse = {
  date: string;
  score: number;
  breakdown: ScoreBreakdown[];
};

function getScoreColor(score: number) {
  if (score >= 100) {
    return {
      bar: "bg-green-500",
    };
  }

  if (score >= 80) {
    return {
      bar: "bg-blue-500",
    };
  }

  if (score >= 50) {
    return {
      bar: "bg-yellow-500",
    };
  }

  if (score >= 40) {
    return {
      bar: "bg-orange-500",
    };
  }

  return {
    bar: "bg-red-500",
  };
}

export default function Home() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [scoreData, setScoreData] =
    useState<ScoreResponse | null>(null);

  const [weeklyScore, setWeeklyScore] =
    useState(0);

  const [monthlyScore, setMonthlyScore] =
    useState(0);

  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [categoryId, setCategoryId] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [value, setValue] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [editingActivityId, setEditingActivityId] =
    useState<number | null>(null);

  const [savingActivity, setSavingActivity] =
    useState(false);

  const selectedCategory =
    categories.find(
      (category) =>
        category.id === Number(categoryId)
    );

  const fetchDashboardData =
    useCallback(async () => {
      const [
        categoriesResponse,
        scoreResponse,
        activitiesResponse,
        weeklyResponse,
        monthlyResponse,
      ] = await Promise.all([
        fetch("/api/categories", {
          cache: "no-store",
        }),
        fetch("/api/score", {
          cache: "no-store",
        }),
        fetch("/api/activities", {
          cache: "no-store",
        }),
        fetch("/api/score/weekly", {
          cache: "no-store",
        }),
        fetch("/api/score/monthly", {
          cache: "no-store",
        }),
      ]);

      if (!categoriesResponse.ok) {
        throw new Error(
          `/api/categories failed: ${categoriesResponse.status}`
        );
      }

      if (!scoreResponse.ok) {
        throw new Error(
          `/api/score failed: ${scoreResponse.status}`
        );
      }

      if (!activitiesResponse.ok) {
        throw new Error(
          `/api/activities failed: ${activitiesResponse.status}`
        );
      }

      if (!weeklyResponse.ok) {
        throw new Error(
          `/api/score/weekly failed: ${weeklyResponse.status}`
        );
      }

      if (!monthlyResponse.ok) {
        throw new Error(
          `/api/score/monthly failed: ${monthlyResponse.status}`
        );
      }

      const categoryList =
        await categoriesResponse.json();

      const score =
        await scoreResponse.json();

      const activityList =
        await activitiesResponse.json();

      const weekly =
        await weeklyResponse.json();

      const monthly =
        await monthlyResponse.json();

      return {
        categories: categoryList,
        score,
        activities: activityList,
        weeklyScore:
          weekly.score ?? 0,
        monthlyScore:
          monthly.score ?? 0,
      };
    }, []);

  function applyDashboardData(data: {
    categories: Category[];
    score: ScoreResponse;
    activities: Activity[];
    weeklyScore: number;
    monthlyScore: number;
  }) {
    setCategories(data.categories);
    setScoreData(data.score);
    setActivities(data.activities);
    setWeeklyScore(data.weeklyScore);
    setMonthlyScore(data.monthlyScore);

    setCategoryId((currentId) => {
      if (
        data.categories.length > 0 &&
        !data.categories.some(
          (category) =>
            category.id ===
            Number(currentId)
        )
      ) {
        return String(
          data.categories[0].id
        );
      }

      return currentId;
    });
  }

  useEffect(() => {
    let cancelled = false;

    fetchDashboardData()
      .then((data) => {
        if (!cancelled) {
          applyDashboardData(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(
            "Dashboard loading failed:",
            error
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchDashboardData]);

  function resetActivityForm() {
    setEditingActivityId(null);
    setTitle("");
    setValue("");
    setNotes("");
    setMessage("");
  }

  function startEditingActivity(
    activity: Activity
  ) {
    const category =
      categories.find(
        (item) =>
          item.id ===
          activity.categoryId
      );

    if (!category) {
      setMessage(
        "The category for this activity is no longer available."
      );
      return;
    }

    setEditingActivityId(
      activity.id
    );

    setCategoryId(
      String(activity.categoryId)
    );

    setTitle(activity.title);

    if (
      category.inputType ===
      "duration"
    ) {
      setValue(
        String(
          activity.durationMinutes ??
            ""
        )
      );
    } else {
      setValue(
        String(
          activity.quantity ?? ""
        )
      );
    }

    setNotes(
      activity.notes ?? ""
    );

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
    setSavingActivity(true);

    try {
      if (!selectedCategory) {
        setMessage(
          "Please select a category."
        );
        return;
      }

      if (!title.trim()) {
        setMessage(
          "Please enter what you did."
        );
        return;
      }

      if (!value) {
        setMessage(
          `Please enter a value in ${selectedCategory.unit}.`
        );
        return;
      }

      const numericValue =
        Number(value);

      if (
        !Number.isInteger(
          numericValue
        ) ||
        numericValue <= 0
      ) {
        setMessage(
          `Please enter a positive integer value in ${selectedCategory.unit}.`
        );
        return;
      }

      const body = {
        date:
          editingActivityId === null
            ? new Date()
                .toISOString()
                .split("T")[0]
            : undefined,

        categoryId:
          selectedCategory.id,

        title: title.trim(),

        durationMinutes:
          selectedCategory.inputType ===
          "duration"
            ? numericValue
            : null,

        quantity:
          selectedCategory.inputType ===
          "quantity"
            ? numericValue
            : null,

        notes:
          notes.trim() || null,
      };

      const url =
        editingActivityId === null
          ? "/api/activities"
          : `/api/activities/${editingActivityId}`;

      const method =
        editingActivityId === null
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
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        setMessage(
          data?.error ??
            "Unable to save activity."
        );
        return;
      }

      const wasEditing =
        editingActivityId !== null;

      resetActivityForm();

      setMessage(
        wasEditing
          ? "Activity updated ✓"
          : "Activity logged ✓"
      );

      const refreshed =
        await fetchDashboardData();

      applyDashboardData(
        refreshed
      );
    } catch (error) {
      console.error(
        "Failed to save activity:",
        error
      );

      setMessage(
        "Unable to save activity."
      );
    } finally {
      setSavingActivity(false);
    }
  }

  async function handleDeleteActivity(
    activity: Activity
  ) {
    const confirmed =
      window.confirm(
        `Delete "${activity.title}" permanently?\n\nThis cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      const response = await fetch(
        `/api/activities/${activity.id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        setMessage(
          data?.error ??
            "Unable to delete activity."
        );
        return;
      }

      if (
        editingActivityId ===
        activity.id
      ) {
        resetActivityForm();
      }

      setMessage(
        `"${activity.title}" deleted.`
      );

      const refreshed =
        await fetchDashboardData();

      applyDashboardData(
        refreshed
      );
    } catch (error) {
      console.error(
        "Failed to delete activity:",
        error
      );

      setMessage(
        "Unable to delete activity."
      );
    }
  }

  const score =
    scoreData?.score ?? 0;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header>
          <p className="text-sm font-medium uppercase tracking-widest text-blue-400">
            Life Maxing
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Career Scoreboard
          </h1>

          <p className="mt-2 text-zinc-400">
            Your actions. Your numbers. No excuses.
          </p>
        </header>

        {/* SCOREBOARD */}
        <section className="mt-10 grid gap-6 md:grid-cols-[320px_1fr]">
          <DashboardScoreboard
            daily={score}
            weekly={weeklyScore}
            monthly={monthlyScore}
          />

          {/* TODAY'S BREAKDOWN */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Today&apos;s Score
              </h2>

              <span className="text-sm text-zinc-500">
                {scoreData?.date ??
                  "Loading..."}
              </span>
            </div>

            <div className="mt-6 space-y-5">
              {scoreData?.breakdown.map(
                (item) => {
                  const percentage =
                    item.weight === 0
                      ? 0
                      : Math.min(
                          100,
                          (item.points /
                            item.weight) *
                            100
                        );

                  const categoryColor =
                    getScoreColor(
                      percentage
                    );

                  return (
                    <div
                      key={
                        item.category
                      }
                    >
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="capitalize">
                          {
                            item.category
                          }
                        </span>

                        <span className="text-zinc-400">
                          {item.points.toFixed(
                            1
                          )}{" "}
                          / {item.weight}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${categoryColor.bar}`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* ACTIVITY + FORM */}
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          {/* LOG / EDIT ACTIVITY */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingActivityId ===
                  null
                    ? "Log Activity"
                    : "Edit Activity"}
                </h2>

                {editingActivityId !==
                  null && (
                  <p className="mt-1 text-sm text-blue-400">
                    Editing existing
                    activity
                  </p>
                )}
              </div>

              {editingActivityId !==
                null && (
                <button
                  type="button"
                  onClick={
                    resetActivityForm
                  }
                  className="text-sm text-zinc-500 transition hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>

            {categories.length ===
            0 ? (
              <div className="mt-5 rounded-lg border border-dashed border-zinc-700 p-5 text-center">
                <p className="text-sm text-zinc-400">
                  No active categories
                  yet.
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Create a category
                  before logging
                  activity.
                </p>
              </div>
            ) : (
              <form
                onSubmit={
                  handleSubmit
                }
                className="mt-5 space-y-4"
              >
                {/* CATEGORY */}
                <select
                  value={categoryId}
                  onChange={(event) => {
                    setCategoryId(
                      event.target
                        .value
                    );
                    setValue("");
                  }}
                  className="w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    )
                  )}
                </select>

                {/* CATEGORY INFO */}
                {selectedCategory && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {
                            selectedCategory.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          Measured in{" "}
                          {
                            selectedCategory.unit
                          }
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-400">
                          {
                            selectedCategory.target
                          }{" "}
                          {
                            selectedCategory.unit
                          }
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          Weight{" "}
                          {
                            selectedCategory.weight
                          }
                          /10
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TITLE */}
                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="What did you do?"
                  required
                  className="w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* MEASUREMENT */}
                {selectedCategory && (
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                      {
                        selectedCategory.unit
                      }
                    </label>

                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={value}
                        onChange={(event) =>
                          setValue(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={`How many ${selectedCategory.unit}?`}
                        required
                        className="w-full rounded-lg bg-zinc-800 p-3 pr-20 outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                        {
                          selectedCategory.unit
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* NOTES */}
                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  placeholder="Notes"
                  rows={3}
                  className="w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="submit"
                  disabled={
                    savingActivity
                  }
                  className="w-full rounded-lg bg-blue-600 p-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingActivity
                    ? "SAVING..."
                    : editingActivityId ===
                        null
                      ? "LOG ACTIVITY"
                      : "SAVE CHANGES"}
                </button>

                {message && (
                  <p
                    className={`text-center text-sm ${
                      message.includes(
                        "Unable"
                      ) ||
                      message.includes(
                        "Please"
                      ) ||
                      message.includes(
                        "required"
                      )
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {message}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* ACTIVITY MATRIX */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Activity Matrix
            </h2>

            <div className="mt-5 space-y-3">
              {activities.length ===
              0 ? (
                <p className="text-sm text-zinc-500">
                  Nothing logged yet.
                </p>
              ) : (
                activities
                  .slice(0, 10)
                  .map(
                    (activity) => (
                      <div
                        key={
                          activity.id
                        }
                        className={`rounded-lg bg-zinc-800 p-4 ${
                          editingActivityId ===
                          activity.id
                            ? "ring-1 ring-blue-500"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-blue-400">
                              {
                                activity.categoryName
                              }
                            </p>

                            <p className="mt-1 font-medium">
                              {
                                activity.title
                              }
                            </p>

                            <p className="mt-1 text-xs text-zinc-600">
                              {
                                activity.date
                              }
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {activity.durationMinutes !==
                              null && (
                              <span className="whitespace-nowrap text-sm text-zinc-400">
                                {
                                  activity.durationMinutes
                                }{" "}
                                {
                                  activity.categoryUnit ??
                                    "min"
                                }
                              </span>
                            )}

                            {activity.quantity !==
                              null && (
                              <span className="whitespace-nowrap text-sm text-zinc-400">
                                {
                                  activity.quantity
                                }{" "}
                                {
                                  activity.categoryUnit ??
                                    ""
                                }
                              </span>
                            )}
                          </div>
                        </div>

                        {activity.notes && (
                          <p className="mt-2 text-sm text-zinc-500">
                            {
                              activity.notes
                            }
                          </p>
                        )}

                        {/* ACTIVITY ACTIONS */}
                        <div className="mt-4 flex gap-2 border-t border-zinc-700 pt-3">
                          <button
                            type="button"
                            onClick={() =>
                              startEditingActivity(
                                activity
                              )
                            }
                            className="rounded-lg bg-zinc-700 px-3 py-2 text-xs font-medium transition hover:bg-zinc-600"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteActivity(
                                activity
                              )
                            }
                            className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  )
              )}
            </div>
          </div>
        </section>

        {/* CATEGORY MANAGEMENT */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Categories
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Configure what you measure
                and how much it matters.
              </p>
            </div>

            <Link
              href="/categories"
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium transition hover:bg-zinc-700"
            >
              Manage Categories
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(
              (category) => (
                <div
                  key={category.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {
                          category.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {
                          category.target
                        }{" "}
                        {
                          category.unit
                        }
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                      {
                        category.weight
                      }
                      /10
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
