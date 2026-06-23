import {
  createBoard,
  getGameStatus,
  getWinningLine,
  getWinner,
  type Board,
  type Player,
} from "../lib/game";
import type { OnlinePlayer, RoomSnapshot, RoomStatus } from "../lib/online";

type Room = {
  code: string;
  status: RoomStatus;
  players: OnlinePlayer[];
  board: Board;
  currentTurn: Player;
  winner: Player | null;
  rematchVotes: Set<string>;
};

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  if (rooms.has(code)) return generateRoomCode();
  return code;
}

export function createRoom(socketId: string, playerName: string): Room {
  leaveRoom(socketId);

  const code = generateRoomCode();
  const room: Room = {
    code,
    status: "waiting",
    players: [
      {
        id: socketId,
        name: playerName.trim() || "Player 1",
        mark: "X",
        connected: true,
      },
    ],
    board: createBoard(),
    currentTurn: "X",
    winner: null,
    rematchVotes: new Set(),
  };

  rooms.set(code, room);
  socketToRoom.set(socketId, code);
  return room;
}

export function joinRoom(
  socketId: string,
  code: string,
  playerName: string,
): { room: Room } | { error: string } {
  leaveRoom(socketId);

  const normalizedCode = code.trim().toUpperCase();
  const room = rooms.get(normalizedCode);

  if (!room) {
    return { error: "Room not found. Check the code and try again." };
  }

  if (room.status !== "waiting") {
    return { error: "This game has already started." };
  }

  if (room.players.length >= 2) {
    return { error: "This room is full." };
  }

  room.players.push({
    id: socketId,
    name: playerName.trim() || "Player 2",
    mark: "O",
    connected: true,
  });
  room.status = "playing";
  room.board = createBoard();
  room.currentTurn = "X";
  room.winner = null;
  room.rematchVotes.clear();

  socketToRoom.set(socketId, normalizedCode);
  return { room };
}

export function leaveRoom(socketId: string): Room | null {
  const code = socketToRoom.get(socketId);
  if (!code) return null;

  const room = rooms.get(code);
  socketToRoom.delete(socketId);
  if (!room) return null;

  room.players = room.players.filter((player) => player.id !== socketId);
  room.rematchVotes.delete(socketId);

  if (room.players.length === 0) {
    rooms.delete(code);
    return null;
  }

  if (room.status === "playing") {
    room.status = "finished";
    const remaining = room.players[0];
    room.winner = remaining.mark;
    room.players.forEach((player) => {
      player.connected = player.id === remaining.id;
    });
  } else {
    rooms.delete(code);
    return null;
  }

  return room;
}

export function markDisconnected(socketId: string): Room | null {
  const code = socketToRoom.get(socketId);
  if (!code) return null;

  const room = rooms.get(code);
  if (!room) return null;

  if (room.status === "waiting") {
    rooms.delete(code);
    socketToRoom.delete(socketId);
    return null;
  }

  const player = room.players.find((entry) => entry.id === socketId);
  if (player) player.connected = false;

  if (room.status === "playing" && room.players.some((entry) => !entry.connected)) {
    room.status = "finished";
    const opponent = room.players.find((entry) => entry.id !== socketId);
    room.winner = opponent?.mark ?? null;
  }

  return room;
}

export function getRoomByCode(code: string): Room | null {
  return rooms.get(code) ?? null;
}

export function getRoomBySocket(socketId: string): Room | null {
  const code = socketToRoom.get(socketId);
  if (!code) return null;
  return rooms.get(code) ?? null;
}

export function makeMove(
  socketId: string,
  index: number,
): { room: Room } | { error: string } {
  const room = getRoomBySocket(socketId);
  if (!room) return { error: "You are not in a room." };
  if (room.status !== "playing") return { error: "This game is not in progress." };

  const player = room.players.find((entry) => entry.id === socketId);
  if (!player) return { error: "Player not found in this room." };
  if (player.mark !== room.currentTurn) return { error: "Not your turn." };
  if (room.board[index] !== null) return { error: "That cell is already taken." };

  const nextBoard = [...room.board];
  nextBoard[index] = player.mark;
  room.board = nextBoard;

  const status = getGameStatus(nextBoard);
  if (status === "playing") {
    room.currentTurn = player.mark === "X" ? "O" : "X";
  } else {
    room.status = "finished";
    room.winner = status === "won" ? getWinner(nextBoard) : null;
  }

  room.rematchVotes.clear();
  return { room };
}

export function requestRematch(socketId: string): Room | null {
  const room = getRoomBySocket(socketId);
  if (!room || room.status !== "finished") return null;

  room.rematchVotes.add(socketId);

  if (room.rematchVotes.size >= room.players.length) {
    room.status = "playing";
    room.board = createBoard();
    room.currentTurn = "X";
    room.winner = null;
    room.rematchVotes.clear();
  }

  return room;
}

export function toSnapshot(room: Room, socketId: string): RoomSnapshot {
  const yourMark =
    room.players.find((player) => player.id === socketId)?.mark ?? null;

  return {
    code: room.code,
    status: room.status,
    board: [...room.board],
    currentTurn: room.currentTurn,
    players: room.players.map(({ name, mark, connected }) => ({
      name,
      mark,
      connected,
    })),
    yourMark,
    winner: room.winner,
    winningLine: getWinningLine(room.board),
    rematchVotes: room.rematchVotes.size,
  };
}
