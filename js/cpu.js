import {
  createBoard,
  getBestMove,
  getGameStatus,
  getWinner,
  getWinningLine,
  renderBoard,
} from "./game.js";

const HUMAN = "X";
const CPU = "O";
const CPU_THINK_MS = 550;

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const scoresEl = {
  player: document.getElementById("score-player"),
  draws: document.getElementById("score-draws"),
  cpu: document.getElementById("score-cpu"),
};

const scores = { player: 0, cpu: 0, draws: 0 };
let board = createBoard();
let currentTurn = HUMAN;
let winningLine = null;
let isCpuThinking = false;
let lastResult = null;

function updateScores() {
  scoresEl.player.textContent = scores.player;
  scoresEl.draws.textContent = scores.draws;
  scoresEl.cpu.textContent = scores.cpu;
}

function setStatus(message) {
  statusEl.textContent = message;
}

function handleGameEnd(endedBoard) {
  const winner = getWinner(endedBoard);
  const status = getGameStatus(endedBoard);
  winningLine = getWinningLine(endedBoard);

  if (status === "draw") {
    lastResult = "Stalemate — it's a draw.";
    scores.draws += 1;
  } else if (winner === HUMAN) {
    lastResult = "Victory! You outplayed the CPU.";
    scores.player += 1;
  } else if (winner === CPU) {
    lastResult = "Defeat — the CPU takes the round.";
    scores.cpu += 1;
  }

  updateScores();
  paint();
}

function paint() {
  const status = getGameStatus(board);
  const gameOver = status !== "playing";
  const canPlay = !gameOver && currentTurn === HUMAN && !isCpuThinking;

  if (lastResult) setStatus(lastResult);
  else if (isCpuThinking) setStatus("CPU is calculating its next move…");
  else if (gameOver) setStatus("Round over — start a new game.");
  else setStatus("Your turn — place an X on the board.");

  renderBoard(boardEl, board, {
    winningLine,
    canPlay,
    onCellClick: handleCellClick,
    opponentTurn: isCpuThinking,
    gameOver,
  });

  document.getElementById("btn-new").textContent = gameOver ? "Play Again" : "New Game";
}

function handleCellClick(index) {
  const status = getGameStatus(board);
  if (status !== "playing" || currentTurn !== HUMAN || isCpuThinking) return;
  if (board[index] !== null) return;

  board = [...board];
  board[index] = HUMAN;

  if (getGameStatus(board) !== "playing") {
    handleGameEnd(board);
    return;
  }

  currentTurn = CPU;
  paint();
  runCpuMove();
}

function runCpuMove() {
  isCpuThinking = true;
  paint();

  setTimeout(() => {
    if (getGameStatus(board) !== "playing") {
      isCpuThinking = false;
      paint();
      return;
    }

    const move = getBestMove([...board], CPU);
    board = [...board];
    board[move] = CPU;

    if (getGameStatus(board) !== "playing") {
      handleGameEnd(board);
    } else {
      currentTurn = HUMAN;
    }

    isCpuThinking = false;
    paint();
  }, CPU_THINK_MS);
}

function resetRound() {
  board = createBoard();
  currentTurn = HUMAN;
  winningLine = null;
  isCpuThinking = false;
  lastResult = null;
  paint();
}

document.getElementById("btn-new").addEventListener("click", resetRound);
document.getElementById("btn-reset-scores").addEventListener("click", () => {
  scores.player = 0;
  scores.cpu = 0;
  scores.draws = 0;
  updateScores();
  resetRound();
});

updateScores();
paint();
