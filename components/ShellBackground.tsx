"use client";

/**
 * Neumorphic shell background.
 *
 * A solid dark surface (#171720) with very subtle CSS radial colour hints —
 * just enough atmospheric depth without conflicting with the neumorphic
 * same-colour-base shadow system.
 */
export function ShellBackground() {
  return (
    <div
      data-shell-bg
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ background: "#171720" }}
      aria-hidden
    >
      {/* Faint cyan depth hint — top left */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-5%",
          width: "55%",
          height: "55%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,229,255,0.028) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Faint violet depth hint — bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: "-8%",
          right: "-4%",
          width: "50%",
          height: "50%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(120,80,255,0.022) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
