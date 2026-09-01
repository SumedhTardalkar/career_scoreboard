"use client";

type ScoreRingsProps = {
  daily: number;
  weekly: number;
  monthly: number;
};

function getColor(score: number) {
  if (score >= 100) return "#166534"; // dark green
  if (score >= 80) return "#22c55e";  // green
  if (score >= 50) return "#3b82f6";  // blue
  if (score >= 40) return "#eab308";  // yellow
  if (score >= 20) return "#f97316";  // orange
  return "#ef4444";                   // red
}

function Ring({
  score,
  radius,
  strokeWidth,
}: {
  score: number;
  radius: number;
  strokeWidth: number;
}) {
  const circumference = 2 * Math.PI * radius;

  const progress = Math.min(
    Math.max(score, 0),
    100
  );

  const offset =
    circumference -
    (progress / 100) * circumference;

  const color = getColor(score);

  return (
    <>
      {/* Background ring */}
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke="#27272a"
        strokeWidth={strokeWidth}
      />

      {/* Progress ring */}
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 100 100)"
        className="transition-all duration-700 ease-out"
      />
    </>
  );
}

export default function ScoreRings({
  daily,
  weekly,
  monthly,
}: ScoreRingsProps) {
  return (
    <div className="relative mx-auto h-72 w-72">
      <svg
        viewBox="0 0 200 200"
        className="h-full w-full"
      >
        {/* Monthly — outer ring */}
        <Ring
          score={monthly}
          radius={86}
          strokeWidth={10}
        />

        {/* Weekly — middle ring */}
        <Ring
          score={weekly}
          radius={68}
          strokeWidth={10}
        />

        {/* Daily — inner ring */}
        <Ring
          score={daily}
          radius={50}
          strokeWidth={10}
        />
      </svg>

      {/* Center score */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Today
          </p>

          <p
            className="mt-1 text-5xl font-bold"
            style={{
              color: getColor(daily),
            }}
          >
            {Math.round(daily)}
          </p>

          <p className="text-sm text-zinc-600">
            / 100
          </p>
        </div>
      </div>
    </div>
  );
}
