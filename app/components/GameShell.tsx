import type { ReactNode } from "react";

export default function GameShell({ children }: { children: ReactNode }) {
  return (
    <div className="game-shell">
      <div className="game-bg" aria-hidden>
        <div className="game-bg-gradient" />
        <div className="game-bg-grid" />
        <div className="game-bg-glow game-bg-glow-left" />
        <div className="game-bg-glow game-bg-glow-right" />
      </div>
      <div className="game-content">{children}</div>
    </div>
  );
}
