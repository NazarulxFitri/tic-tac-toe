import type { Board, Player } from "./game";

export type RoomStatus = "waiting" | "playing" | "finished";

export type OnlinePlayer = {
  id: string;
  name: string;
  mark: Player;
  connected: boolean;
};

export type RoomSnapshot = {
  code: string;
  status: RoomStatus;
  board: Board;
  currentTurn: Player;
  players: Pick<OnlinePlayer, "name" | "mark" | "connected">[];
  yourMark: Player | null;
  winner: Player | null;
  winningLine: number[] | null;
  rematchVotes: number;
};

export const SOCKET_EVENTS = {
  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  ROOM_STATE: "room:state",
  ROOM_ERROR: "room:error",
  GAME_MOVE: "game:move",
  GAME_REMATCH: "game:rematch",
} as const;

export function getSocketUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_SOCKET_URL ?? window.location.origin;
  }

  const port = process.env.PORT ?? "3000";
  const hostname = process.env.HOSTNAME ?? "localhost";
  return process.env.NEXT_PUBLIC_SOCKET_URL ?? `http://${hostname}:${port}`;
}
