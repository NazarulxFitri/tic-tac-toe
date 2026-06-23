"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  type Board,
  type Player,
  createBoard,
  getBestMove,
  getGameStatus,
  getWinner,
  getWinningLine,
} from "@/lib/game";
import GameBoard from "./GameBoard";
import GameShell from "./GameShell";

type Scores = { player: number; cpu: number; draws: number };

const HUMAN: Player = "X";
const CPU: Player = "O";
const CPU_THINK_MS = 550;

export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(createBoard);
  const [currentTurn, setCurrentTurn] = useState<Player>(HUMAN);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState<Scores>({ player: 0, cpu: 0, draws: 0 });
  const [isCpuThinking, setIsCpuThinking] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const status = getGameStatus(board);
  const gameOver = status !== "playing";
  const canPlay = !gameOver && currentTurn === HUMAN && !isCpuThinking;

  const resetRound = useCallback(() => {
    setBoard(createBoard());
    setCurrentTurn(HUMAN);
    setWinningLine(null);
    setIsCpuThinking(false);
    setLastResult(null);
  }, []);

  const handleGameEnd = useCallback((endedBoard: Board) => {
    const endedWinner = getWinner(endedBoard);
    const endedStatus = getGameStatus(endedBoard);
    const line = getWinningLine(endedBoard);
    setWinningLine(line);

    if (endedStatus === "draw") {
      setLastResult("Stalemate — it's a draw.");
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
    } else if (endedWinner === HUMAN) {
      setLastResult("Victory! You outplayed the CPU.");
      setScores((s) => ({ ...s, player: s.player + 1 }));
    } else if (endedWinner === CPU) {
      setLastResult("Defeat — the CPU takes the round.");
      setScores((s) => ({ ...s, cpu: s.cpu + 1 }));
    }
  }, []);

  const applyMove = useCallback(
    (index: number, player: Player) => {
      setBoard((prev) => {
        if (prev[index] !== null) return prev;

        const next = [...prev];
        next[index] = player;

        const nextStatus = getGameStatus(next);
        if (nextStatus !== "playing") {
          queueMicrotask(() => handleGameEnd(next));
        } else {
          setCurrentTurn(player === HUMAN ? CPU : HUMAN);
        }

        return next;
      });
    },
    [handleGameEnd],
  );

  const handleCellClick = (index: number) => {
    if (!canPlay || board[index] !== null) return;
    applyMove(index, HUMAN);
  };

  useEffect(() => {
    if (gameOver || currentTurn !== CPU) return;

    setIsCpuThinking(true);

    const timer = window.setTimeout(() => {
      setBoard((prev) => {
        if (getGameStatus(prev) !== "playing") {
          return prev;
        }

        const move = getBestMove([...prev], CPU);
        const next = [...prev];
        next[move] = CPU;

        const nextStatus = getGameStatus(next);
        if (nextStatus !== "playing") {
          queueMicrotask(() => handleGameEnd(next));
        } else {
          setCurrentTurn(HUMAN);
        }

        return next;
      });
      setIsCpuThinking(false);
    }, CPU_THINK_MS);

    return () => window.clearTimeout(timer);
  }, [board, currentTurn, gameOver, handleGameEnd]);

  const statusMessage = (() => {
    if (lastResult) return lastResult;
    if (isCpuThinking) return "CPU is calculating its next move…";
    if (gameOver) return "Round over — start a new game.";
    return "Your turn — place an X on the board.";
  })();

  return (
    <GameShell>
      <header className="game-header">
        <p className="game-eyebrow">Arcade Arena</p>
        <h1 className="game-title">Tic Tac Toe</h1>
        <p className="game-subtitle">
          <span className="player-tag player-tag-you">You</span>
          <span className="vs-badge">VS</span>
          <span className="player-tag player-tag-cpu">CPU</span>
        </p>
      </header>

      <section className="score-panel" aria-label="Scoreboard">
        <div className="score-card score-card-you">
          <span className="score-label">You</span>
          <span className="score-value">{scores.player}</span>
        </div>
        <div className="score-card score-card-draw">
          <span className="score-label">Draws</span>
          <span className="score-value">{scores.draws}</span>
        </div>
        <div className="score-card score-card-cpu">
          <span className="score-label">CPU</span>
          <span className="score-value">{scores.cpu}</span>
        </div>
      </section>

      <p className="status-banner" role="status" aria-live="polite">
        {statusMessage}
      </p>

      <GameBoard
        board={board}
        winningLine={winningLine}
        canPlay={canPlay}
        onCellClick={handleCellClick}
        opponentTurn={isCpuThinking}
        gameOver={gameOver}
      />

      <div className="game-actions">
        <button type="button" className="btn-primary" onClick={resetRound}>
          {gameOver ? "Play Again" : "New Game"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setScores({ player: 0, cpu: 0, draws: 0 });
            resetRound();
          }}
        >
          Reset Scores
        </button>
        <Link href="/" className="btn-ghost">
          Back to Menu
        </Link>
      </div>

      <footer className="game-footer">
        <p>
          You play as <strong className="mark-x">X</strong>. CPU plays as{" "}
          <strong className="mark-o">O</strong>.
        </p>
        <p className="game-hint">
          The CPU uses optimal strategy — can you force a draw?
        </p>
      </footer>
    </GameShell>
  );
}
