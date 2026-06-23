import type { Board, Cell } from "@/lib/game";

export function CellMark({ value }: { value: Cell }) {
  if (!value) return null;

  return (
    <span
      className={`cell-mark cell-mark-${value.toLowerCase()}`}
      aria-hidden
    >
      {value}
    </span>
  );
}

type GameBoardProps = {
  board: Board;
  winningLine: number[] | null;
  canPlay: boolean;
  onCellClick: (index: number) => void;
  opponentTurn?: boolean;
  gameOver?: boolean;
};

export default function GameBoard({
  board,
  winningLine,
  canPlay,
  onCellClick,
  opponentTurn = false,
  gameOver = false,
}: GameBoardProps) {
  return (
    <div
      className={`board ${gameOver ? "board-ended" : ""} ${opponentTurn ? "board-cpu-turn" : ""}`}
      role="grid"
      aria-label="Tic tac toe board"
    >
      {board.map((cell, index) => {
        const isWinning = winningLine?.includes(index) ?? false;

        return (
          <button
            key={index}
            type="button"
            className={`board-cell ${cell ? `board-cell-${cell.toLowerCase()}` : ""} ${isWinning ? "board-cell-winning" : ""}`}
            onClick={() => onCellClick(index)}
            disabled={!canPlay || cell !== null}
            role="gridcell"
            aria-label={
              cell ? `Cell ${index + 1}, ${cell}` : `Cell ${index + 1}, empty`
            }
          >
            <CellMark value={cell} />
          </button>
        );
      })}
    </div>
  );
}
