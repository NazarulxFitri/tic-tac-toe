"use client";

import Link from "next/link";
import { useState } from "react";
import { useOnlineGame } from "@/hooks/useOnlineGame";
import { useSocket } from "@/hooks/useSocket";
import GameBoard from "./GameBoard";
import GameShell from "./GameShell";

type Phase = "setup" | "lobby" | "playing";

export default function OnlineGame() {
  const { socket, connected, connecting, error: socketError } = useSocket();
  const {
    room,
    error: roomError,
    createRoom,
    joinRoom,
    makeMove,
    requestRematch,
    leaveRoom,
    resetSession,
  } = useOnlineGame(socket, connected);

  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joinMode, setJoinMode] = useState(false);

  const phase: Phase = !room
    ? "setup"
    : room.status === "waiting"
      ? "lobby"
      : "playing";

  const yourMark = room?.yourMark ?? null;
  const opponent = room?.players.find((player) => player.mark !== yourMark);
  const isYourTurn =
    room?.status === "playing" &&
    yourMark !== null &&
    room.currentTurn === yourMark;
  const gameOver = room?.status === "finished";
  const canPlay = Boolean(isYourTurn && !gameOver);

  const statusMessage = (() => {
    if (connecting) return "Connecting to game server…";
    if (!connected) return "Game server offline — restart with yarn dev.";
    if (!room) return joinMode ? "Enter a room code to join." : "Create a room and share the code.";
    if (room.status === "waiting") {
      return `Room ${room.code} — waiting for opponent to join…`;
    }
    if (gameOver) {
      if (room.winner === yourMark) return "You win this round!";
      if (room.winner && room.winner !== yourMark) {
        return `${opponent?.name ?? "Opponent"} wins this round.`;
      }
      return "Stalemate — it's a draw.";
    }
    if (isYourTurn) return "Your turn — make your move.";
    return `Waiting for ${opponent?.name ?? "opponent"}…`;
  })();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = playerName.trim() || "Player";
    if (joinMode) {
      joinRoom(roomCode, name);
    } else {
      createRoom(name);
    }
  };

  const handleLeave = () => {
    leaveRoom();
    resetSession();
    setJoinMode(false);
    setRoomCode("");
  };

  const error = socketError ?? roomError;

  return (
    <GameShell>
      <header className="game-header">
        <p className="game-eyebrow">Online Lobby</p>
        <h1 className="game-title">Tic Tac Toe</h1>
        {room ? (
          <p className="game-subtitle">
            <span className="player-tag player-tag-you">
              {room.players.find((p) => p.mark === yourMark)?.name ?? "You"}{" "}
              ({yourMark})
            </span>
            <span className="vs-badge">VS</span>
            <span className="player-tag player-tag-cpu">
              {opponent?.name ?? "Waiting…"} {opponent ? `(${opponent.mark})` : ""}
            </span>
          </p>
        ) : (
          <p className="game-tagline">Play with a friend in real time</p>
        )}
      </header>

      {phase === "setup" && (
        <>
          <p
            className={`status-banner ${!connected ? "status-banner-warning" : ""}`}
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </p>

          <form className="lobby-panel" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="player-name">
            Your name
          </label>
          <input
            id="player-name"
            className="field-input"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            autoComplete="nickname"
          />

          {joinMode && (
            <>
              <label className="field-label" htmlFor="room-code">
                Room code
              </label>
              <input
                id="room-code"
                className="field-input field-input-code"
                value={roomCode}
                onChange={(event) =>
                  setRoomCode(event.target.value.toUpperCase())
                }
                placeholder="ABC123"
                maxLength={6}
                autoComplete="off"
              />
            </>
          )}

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={!connected || (joinMode && roomCode.trim().length < 6)}
          >
            {!connected
              ? connecting
                ? "Connecting…"
                : "Server Offline"
              : joinMode
                ? "Join Room"
                : "Create Room"}
          </button>

          <button
            type="button"
            className="btn-ghost btn-full"
            onClick={() => setJoinMode((value) => !value)}
          >
            {joinMode ? "Create a room instead" : "Have a code? Join a room"}
          </button>
        </form>
        </>
      )}

      {phase === "lobby" && room && (
        <section className="lobby-panel lobby-waiting">
          <p className="lobby-label">Share this room code</p>
          <p className="room-code-display">{room.code}</p>
          <p className="lobby-hint">
            Send the code to your friend. The game starts when they join.
          </p>
          <button type="button" className="btn-ghost btn-full" onClick={handleLeave}>
            Cancel
          </button>
        </section>
      )}

      {phase === "playing" && room && (
        <>
          <p className="status-banner" role="status" aria-live="polite">
            {statusMessage}
          </p>

          <GameBoard
            board={room.board}
            winningLine={room.winningLine}
            canPlay={canPlay}
            onCellClick={makeMove}
            opponentTurn={!isYourTurn && !gameOver}
            gameOver={gameOver}
          />

          <div className="game-actions">
            {gameOver ? (
              <button type="button" className="btn-primary" onClick={requestRematch}>
                {room.rematchVotes > 0 ? "Waiting for rematch…" : "Rematch"}
              </button>
            ) : null}
            <button type="button" className="btn-ghost" onClick={handleLeave}>
              Leave Room
            </button>
          </div>
        </>
      )}

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="game-actions">
        <Link href="/" className="btn-ghost">
          Back to Menu
        </Link>
      </div>

      <footer className="game-footer">
        <p>
          Host plays as <strong className="mark-x">X</strong>. Guest plays as{" "}
          <strong className="mark-o">O</strong>.
        </p>
        {connected ? (
          <p className="game-hint connection-ok">Connected to game server.</p>
        ) : (
          <p className="game-hint">
            Run <code>yarn dev</code> or <code>npm run dev</code> to start the
            app and socket server together.
          </p>
        )}
      </footer>
    </GameShell>
  );
}
