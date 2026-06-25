import {
  createBoard,
  generateRoomCode,
  getGameStatus,
  getWinner,
  getWinningLine,
  renderBoard,
} from "./game.js";

const setupPanel = document.getElementById("setup-panel");
const lobbyPanel = document.getElementById("lobby-panel");
const gamePanel = document.getElementById("game-panel");
const statusEl = document.getElementById("status");
const boardEl = document.getElementById("board");
const roomCodeEl = document.getElementById("room-code");
const subtitleEl = document.getElementById("subtitle");
const errorEl = document.getElementById("error");
const nameInput = document.getElementById("player-name");
const codeInput = document.getElementById("room-code-input");
const codeFieldWrap = codeInput.parentElement;
const joinModeBtn = document.getElementById("btn-toggle-mode");
const submitBtn = document.getElementById("btn-submit");

let joinMode = false;
let peer = null;
let conn = null;
let myName = "";
let myMark = null;
let opponentName = "";
let isHost = false;
let board = createBoard();
let currentTurn = "X";
let winningLine = null;
let gameStatus = "lobby";

function showError(message) {
  if (!message) {
    errorEl.hidden = true;
    errorEl.textContent = "";
    return;
  }
  errorEl.hidden = false;
  errorEl.textContent = message;
}

function setStatus(message) {
  statusEl.textContent = message;
}

function showPhase(phase) {
  setupPanel.hidden = phase !== "setup";
  lobbyPanel.hidden = phase !== "lobby";
  gamePanel.hidden = phase !== "game";
}

function updateSubtitle() {
  if (gameStatus === "lobby" && isHost) {
    subtitleEl.innerHTML = `<span class="player-tag player-tag-you">${myName} (host)</span>`;
    return;
  }

  if (myMark) {
    subtitleEl.innerHTML = `
      <span class="player-tag player-tag-you">${myName} (${myMark})</span>
      <span class="vs-badge">VS</span>
      <span class="player-tag player-tag-cpu">${opponentName || "Waiting…"}${opponentName ? ` (${myMark === "X" ? "O" : "X"})` : ""}</span>
    `;
  } else {
    subtitleEl.innerHTML = `<p class="game-tagline">Play with a friend in real time</p>`;
  }
}

function paint() {
  const status = getGameStatus(board);
  const gameOver = status !== "playing" && gameStatus === "playing";
  const isYourTurn = gameStatus === "playing" && myMark && currentTurn === myMark;
  const canPlay = Boolean(isYourTurn && !gameOver);

  if (gameStatus === "playing") {
    if (gameOver) {
      const winner = getWinner(board);
      if (winner === myMark) setStatus("You win this round!");
      else if (winner) setStatus(`${opponentName} wins this round.`);
      else setStatus("Stalemate — it's a draw.");
    } else if (isYourTurn) {
      setStatus("Your turn — make your move.");
    } else {
      setStatus(`Waiting for ${opponentName}…`);
    }
  }

  renderBoard(boardEl, board, {
    winningLine,
    canPlay,
    onCellClick: handleCellClick,
    opponentTurn: !isYourTurn && !gameOver,
    gameOver,
  });
}

function send(data) {
  if (conn?.open) conn.send(data);
}

function applyState(payload) {
  board = [...payload.board];
  currentTurn = payload.currentTurn;
  gameStatus = payload.gameStatus;
  winningLine = payload.winningLine ?? getWinningLine(board);
  showPhase("game");
  updateSubtitle();
  paint();
}

function handleCellClick(index) {
  if (gameStatus !== "playing") return;
  if (currentTurn !== myMark) return;
  if (board[index] !== null) return;

  send({ type: "move", index, player: myMark });
  applyLocalMove(index, myMark);
}

function applyLocalMove(index, player) {
  board = [...board];
  board[index] = player;

  const status = getGameStatus(board);
  if (status !== "playing") {
    gameStatus = "finished";
    winningLine = getWinningLine(board);
  } else {
    currentTurn = player === "X" ? "O" : "X";
  }

  paint();
}

function handleData(data) {
  if (data.type === "hello") {
    opponentName = data.name;
    updateSubtitle();
    setStatus(`Connected with ${opponentName}. Game starting…`);
  }

  if (data.type === "start") {
    if (!isHost) myMark = "O";
    applyState(data);
  }

  if (data.type === "move") {
    if (board[data.index] !== null) return;
    if (data.player !== currentTurn) return;
    applyLocalMove(data.index, data.player);
  }

  if (data.type === "rematch-request" && isHost) {
    const payload = {
      type: "start",
      board: createBoard(),
      currentTurn: "X",
      gameStatus: "playing",
      winningLine: null,
    };
    send(payload);
    applyState(payload);
  }
}

function setupConnection(connection) {
  conn = connection;
  conn.on("open", () => {
    showError("");
    if (isHost) {
      connection.send({ type: "hello", name: myName });
      startHostedGame();
    } else {
      connection.send({ type: "hello", name: myName });
    }
  });
  conn.on("data", handleData);
  conn.on("close", () => {
    showError("Opponent disconnected.");
    setStatus("Connection closed.");
  });
  conn.on("error", () => {
    showError("Connection error. Try again.");
  });
}

function startHostedGame() {
  board = createBoard();
  currentTurn = "X";
  gameStatus = "playing";
  winningLine = null;
  myMark = "X";

  const payload = {
    type: "start",
    board,
    currentTurn,
    gameStatus,
    winningLine: null,
  };

  send(payload);
  applyState({ ...payload, gameStatus: "playing" });
}

function destroyPeer() {
  conn?.close();
  peer?.destroy();
  conn = null;
  peer = null;
}

function createRoom() {
  destroyPeer();
  showError("");

  myName = nameInput.value.trim() || "Player";
  isHost = true;
  myMark = "X";
  opponentName = "";
  gameStatus = "lobby";

  const roomCode = generateRoomCode();
  roomCodeEl.textContent = roomCode;
  setStatus(`Room ${roomCode} — waiting for opponent…`);
  showPhase("lobby");
  updateSubtitle();

  peer = new Peer(roomCode);

  peer.on("open", () => {
    setStatus(`Room ${roomCode} — waiting for opponent to join…`);
  });

  peer.on("connection", (connection) => {
    setupConnection(connection);
  });

  peer.on("error", (err) => {
    if (err.type === "unavailable-id") {
      createRoom();
      return;
    }
    showError(err.message || "Could not create room. Try again.");
  });
}

function joinRoom() {
  destroyPeer();
  showError("");

  myName = nameInput.value.trim() || "Player";
  const roomCode = codeInput.value.trim().toUpperCase();
  if (roomCode.length < 6) {
    showError("Enter a valid 6-character room code.");
    return;
  }

  isHost = false;
  myMark = "O";
  opponentName = "";
  gameStatus = "lobby";
  setStatus(`Joining room ${roomCode}…`);
  showPhase("game");
  updateSubtitle();

  peer = new Peer();

  peer.on("open", () => {
    const connection = peer.connect(roomCode);
    setupConnection(connection);

    connection.on("open", () => {
      setStatus("Connected! Waiting for host to start…");
    });

    connection.on("error", () => {
      showError("Could not join room. Check the code and try again.");
    });
  });

  peer.on("error", (err) => {
    showError(err.message || "Could not connect. Try again.");
  });
}

function leaveRoom() {
  destroyPeer();
  board = createBoard();
  currentTurn = "X";
  winningLine = null;
  myMark = null;
  gameStatus = "lobby";
  joinMode = false;
  codeInput.value = "";
  joinModeBtn.textContent = "Have a code? Join a room";
  submitBtn.textContent = "Create Room";
  codeFieldWrap.hidden = true;
  showPhase("setup");
  setStatus("Create a room and share the code.");
  updateSubtitle();
  showError("");
}

joinModeBtn.addEventListener("click", () => {
  joinMode = !joinMode;
  codeFieldWrap.hidden = !joinMode;
  joinModeBtn.textContent = joinMode
    ? "Create a room instead"
    : "Have a code? Join a room";
  submitBtn.textContent = joinMode ? "Join Room" : "Create Room";
  setStatus(joinMode ? "Enter a room code to join." : "Create a room and share the code.");
});

document.getElementById("setup-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (joinMode) joinRoom();
  else createRoom();
});

document.getElementById("btn-cancel").addEventListener("click", leaveRoom);
document.getElementById("btn-leave").addEventListener("click", leaveRoom);
function resetForRematch() {
  board = createBoard();
  currentTurn = "X";
  gameStatus = "playing";
  winningLine = null;
  paint();
}

document.getElementById("btn-rematch").addEventListener("click", () => {
  if (isHost) {
    const payload = {
      type: "start",
      board: createBoard(),
      currentTurn: "X",
      gameStatus: "playing",
      winningLine: null,
    };
    send(payload);
    applyState(payload);
  } else {
    send({ type: "rematch-request" });
    setStatus("Rematch requested — waiting for host…");
  }
});

showPhase("setup");
setStatus("Create a room and share the code.");
updateSubtitle();
