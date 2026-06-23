export type Player = "X" | "O";
export type Cell = Player | null;
export type Board = Cell[];
export type GameStatus = "playing" | "won" | "draw";

export const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export const EMPTY_BOARD: Board = Array(9).fill(null);

export function createBoard(): Board {
  return [...EMPTY_BOARD];
}

export function getWinner(board: Board): Player | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export function getWinningLine(board: Board): number[] | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [...line];
    }
  }
  return null;
}

export function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

export function getGameStatus(board: Board): GameStatus {
  if (getWinner(board)) return "won";
  if (isBoardFull(board)) return "draw";
  return "playing";
}

export function getAvailableMoves(board: Board): number[] {
  return board
    .map((cell, index) => (cell === null ? index : -1))
    .filter((index) => index !== -1);
}

function minimax(
  board: Board,
  isMaximizing: boolean,
  ai: Player,
  human: Player,
): number {
  const winner = getWinner(board);
  if (winner === ai) return 1;
  if (winner === human) return -1;
  if (isBoardFull(board)) return 0;

  const moves = getAvailableMoves(board);

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const trial = [...board];
      trial[move] = ai;
      best = Math.max(best, minimax(trial, false, ai, human));
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    const trial = [...board];
    trial[move] = human;
    best = Math.min(best, minimax(trial, true, ai, human));
  }
  return best;
}

export function getBestMove(board: Board, ai: Player = "O"): number {
  const human: Player = ai === "O" ? "X" : "O";
  const moves = getAvailableMoves(board);

  if (moves.length === 9) {
    const openingMoves = [0, 2, 4, 6, 8];
    return openingMoves[Math.floor(Math.random() * openingMoves.length)];
  }

  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const move of moves) {
    const trial = [...board];
    trial[move] = ai;
    const score = minimax(trial, false, ai, human);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
