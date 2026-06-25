const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createBoard() {
  return Array(9).fill(null);
}

export function getWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export function getWinningLine(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [...line];
    }
  }
  return null;
}

export function getGameStatus(board) {
  if (getWinner(board)) return "won";
  if (board.every((cell) => cell !== null)) return "draw";
  return "playing";
}

export function getAvailableMoves(board) {
  return board
    .map((cell, index) => (cell === null ? index : -1))
    .filter((index) => index !== -1);
}

function minimax(board, isMaximizing, ai, human) {
  const winner = getWinner(board);
  if (winner === ai) return 1;
  if (winner === human) return -1;
  if (board.every((cell) => cell !== null)) return 0;

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

export function getBestMove(board, ai = "O") {
  const human = ai === "O" ? "X" : "O";
  const moves = getAvailableMoves(board);

  if (moves.length === 9) {
    const openings = [0, 2, 4, 6, 8];
    return openings[Math.floor(Math.random() * openings.length)];
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

export function generateRoomCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function renderBoard(container, board, options = {}) {
  const {
    winningLine = null,
    canPlay = false,
    onCellClick = null,
    opponentTurn = false,
    gameOver = false,
  } = options;

  container.className = `board${gameOver ? " board-ended" : ""}${opponentTurn ? " board-cpu-turn" : ""}`;
  container.innerHTML = "";

  board.forEach((cell, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "board-cell";
    if (cell) button.classList.add(`board-cell-${cell.toLowerCase()}`);
    if (winningLine?.includes(index)) button.classList.add("board-cell-winning");
    button.disabled = !canPlay || cell !== null;
    button.setAttribute("role", "gridcell");
    button.setAttribute(
      "aria-label",
      cell ? `Cell ${index + 1}, ${cell}` : `Cell ${index + 1}, empty`,
    );

    if (cell) {
      const mark = document.createElement("span");
      mark.className = `cell-mark cell-mark-${cell.toLowerCase()}`;
      mark.textContent = cell;
      mark.setAttribute("aria-hidden", "true");
      button.appendChild(mark);
    }

    if (onCellClick) {
      button.addEventListener("click", () => onCellClick(index));
    }

    container.appendChild(button);
  });
}
