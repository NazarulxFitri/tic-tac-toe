import Link from "next/link";
import GameShell from "./GameShell";

export default function HomeMenu() {
  return (
    <GameShell>
      <header className="game-header">
        <p className="game-eyebrow">Arcade Arena</p>
        <h1 className="game-title">Tic Tac Toe</h1>
        <p className="game-tagline">Choose your battle mode</p>
      </header>

      <div className="mode-grid">
        <Link href="/cpu" className="mode-card mode-card-cpu">
          <span className="mode-icon">🤖</span>
          <span className="mode-title">Vs CPU</span>
          <span className="mode-desc">
            Solo arcade mode. Face an optimal AI opponent.
          </span>
        </Link>

        <Link href="/online" className="mode-card mode-card-online">
          <span className="mode-icon">🌐</span>
          <span className="mode-title">Online</span>
          <span className="mode-desc">
            Create or join a room lobby and play against a friend.
          </span>
        </Link>
      </div>

      <footer className="game-footer">
        <p className="game-hint">Neon-lit classic. Local or across the wire.</p>
      </footer>
    </GameShell>
  );
}
