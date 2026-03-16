"use client";

export type ShotDotsProps = {
  shotsTaken: number;
  shotsPerRound: number;
};

export function ShotDots({ shotsTaken, shotsPerRound }: ShotDotsProps) {
  return (
    <div
      className="flex gap-1 items-center"
      aria-label={`${shotsTaken} of ${shotsPerRound} shots`}
    >
      {Array.from({ length: shotsPerRound }, (_, i) => (
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            i < shotsTaken
              ? "bg-primaryNeon"
              : "border border-glassBorder bg-transparent"
          }`}
        />
      ))}
    </div>
  );
}
