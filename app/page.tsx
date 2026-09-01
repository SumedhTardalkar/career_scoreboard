"use client";

import { FormEvent, useEffect, useState } from "react";
import ScoreRings from "@/components/ScoreRings";

type Activity = {
  id: number;
  date: string;
  category: string;
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

const categories = [
  "coding",
  "dsa",
  "engineering",
  "project",
  "career",
  "health",
];

function getScoreColor(score: number) {
  if (score >= 100) {
    return {
      border: "border-green-500",
      text: "text-green-400",
      bar: "bg-green-500",
    };
  }

  if (score >= 80) {
    return {
      border: "border-blue-500",
      text: "text-blue-400",
      bar: "bg-blue-500",
    };
  }

  if (score >= 50) {
    return {
      border: "border-yellow-500",
      text: "text-yellow-400",
      bar: "bg-yellow-500",
    };
  }

  if (score >= 40) {
    return {
      border: "border-orange-500",
      text: "text-orange-400",
      bar: "bg-orange-500",
    };
  }

  return {
    border: "border-red-500",
    text: "text-red-400",
    bar: "bg-red-500",
  };
}

export default function Home() {
  const [scoreData, setScoreData] = useState<ScoreResponse | null>(null);
  const [weeklyScore, setWeeklyScore] = useState(0);
  const [monthlyScore, setMonthlyScore] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [category, setCategory] = useState("coding");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  async function loadDashboard() {
    const [
      scoreResponse,
      activitiesResponse,
      weeklyResponse,
      monthlyResponse,
    ] = await Promise.all([
      fetch("/api/score"),
      fetch("/api/activities"),
      fetch("/api/score/weekly"),
      fetch("/api/score/monthly"),
    ]);

    if (
      !scoreResponse.ok ||
      !activitiesResponse.ok ||
      !weeklyResponse.ok ||
      !monthlyResponse.ok
    ) {
      throw new Error("Failed to load dashboard");
    }

    const score = await scoreResponse.json();
    const activityList = await activitiesResponse.json();
    const weekly = await weeklyResponse.json();
    const monthly = await monthlyResponse.json();

    setScoreData(score);
    setActivities(activityList);
    setWeeklyScore(weekly.score ?? 0);
    setMonthlyScore(monthly.score ?? 0);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [
          scoreResponse,
          activitiesResponse,
          weeklyResponse,
          monthlyResponse,
        ] = await Promise.all([
          fetch("/api/score"),
          fetch("/api/activities"),
          fetch("/api/score/weekly"),
          fetch("/api/score/monthly"),
        ]);

        if (
          !scoreResponse.ok ||
          !activitiesResponse.ok ||
          !weeklyResponse.ok ||
          !monthlyResponse.ok
        ) {
          throw new Error("Failed to load dashboard");
        }

        const score = await scoreResponse.json();
        const activityList = await activitiesResponse.json();
        const weekly = await weeklyResponse.json();
        const monthly = await monthlyResponse.json();

        if (!cancelled) {
          setScoreData(score);
          setActivities(activityList);
          setWeeklyScore(weekly.score ?? 0);
          setMonthlyScore(monthly.score ?? 0);
        }
      } catch (error) {
        console.error("Dashboard loading failed:", error);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/activities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: new Date().toISOString().split("T")[0],
        category,
        title,
        durationMinutes: duration ? Number(duration) : null,
        quantity: quantity ? Number(quantity) : null,
        notes: notes || null,
      }),
    });

    if (!response.ok) {
      setMessage("Something went wrong.");
      return;
    }

    setTitle("");
    setDuration("");
    setQuantity("");
    setNotes("");
    setMessage("Activity logged ✓");

    try {
      await loadDashboard();
    } catch (error) {
      console.error("Failed to refresh dashboard:", error);
    }
  }

  const score = scoreData?.score ?? 0;
  const scorePercentage = Math.min(Math.max(score, 0), 100);
  const scoreColor = getScoreColor(scorePercentage);

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
          {/* THREE RINGS */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
            <p className="text-sm uppercase tracking-widest text-zinc-500">
              Scoreboard
            </p>

            <div className="mt-6">
              <ScoreRings
                daily={score}
                weekly={weeklyScore}
                monthly={monthlyScore}
              />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm font-semibold text-white">
                  {Math.round(score)}
                </div>

                <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
                  Daily
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-white">
                  {Math.round(weeklyScore)}
                </div>

                <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
                  Weekly
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-white">
                  {Math.round(monthlyScore)}
                </div>

                <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
                  Monthly
                </div>
              </div>
            </div>
          </div>

          {/* TODAY'S BREAKDOWN */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Today&apos;s Score
              </h2>

              <span className="text-sm text-zinc-500">
                {scoreData?.date ?? "Loading..."}
              </span>
            </div>

            <div className="mt-6 space-y-5">
              {scoreData?.breakdown.map((item) => {
                const percentage =
                  item.weight === 0
                    ? 0
                    : Math.min(
                        100,
                        (item.points / item.weight) * 100
                      );

                const categoryColor = getScoreColor(percentage);

                return (
                  <div key={item.category}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="capitalize">
                        {item.category}
                      </span>

                      <span className="text-zinc-400">
                        {item.points.toFixed(1)} / {item.weight}
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
              })}
            </div>
          </div>
        </section>

        {/* ACTIVITY + FORM */}
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          {/* LOG ACTIVITY */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Log Activity
            </h2>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 p-3"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item.toUpperCase()}
                  </option>
                ))}
              </select>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What did you do?"
                required
                className="w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Minutes"
                  className="w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Quantity"
                  className="w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes"
                rows={3}
                className="w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 p-3 font-semibold transition hover:bg-blue-500"
              >
                LOG ACTIVITY
              </button>

              {message && (
                <p
                  className={`text-center text-sm ${
                    message.includes("Something")
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {message}
                </p>
              )}
            </form>
          </div>

          {/* ACTIVITY MATRIX */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Activity Matrix
            </h2>

            <div className="mt-5 space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Nothing logged yet.
                </p>
              ) : (
                activities.slice(0, 10).map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-lg bg-zinc-800 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium capitalize text-blue-400">
                          {activity.category}
                        </p>

                        <p className="mt-1 font-medium">
                          {activity.title}
                        </p>
                      </div>

                      {activity.durationMinutes !== null && (
                        <span className="whitespace-nowrap text-sm text-zinc-400">
                          {activity.durationMinutes} min
                        </span>
                      )}
                    </div>

                    {activity.quantity !== null && (
                      <p className="mt-2 text-sm text-zinc-500">
                        Quantity: {activity.quantity}
                      </p>
                    )}

                    {activity.notes && (
                      <p className="mt-2 text-sm text-zinc-500">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
