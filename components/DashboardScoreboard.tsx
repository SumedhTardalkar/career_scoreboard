"use client";

import ScoreRings from "@/components/ScoreRings";

type DashboardScoreboardProps = {
  daily: number;
  weekly: number;
  monthly: number;
};

export default function DashboardScoreboard({
  daily,
  weekly,
  monthly,
}: DashboardScoreboardProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
      <p className="text-sm uppercase tracking-widest text-zinc-500">
        Scoreboard
      </p>

      <div className="mt-6">
        <ScoreRings
          daily={daily}
          weekly={weekly}
          monthly={monthly}
        />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-sm font-semibold text-white">
            {Math.round(daily)}
          </div>

          <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
            Daily
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-white">
            {Math.round(weekly)}
          </div>

          <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
            Weekly
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-white">
            {Math.round(monthly)}
          </div>

          <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
            Monthly
          </div>
        </div>
      </div>
    </div>
  );
}
