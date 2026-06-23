import type { Server } from "socket.io";
import { SOCKET_EVENTS } from "../lib/online";
import {
  createRoom,
  getRoomByCode,
  joinRoom,
  leaveRoom,
  makeMove,
  markDisconnected,
  requestRematch,
  toSnapshot,
} from "./room-manager";

async function broadcastRoom(io: Server, roomCode: string) {
  const room = getRoomByCode(roomCode);
  if (!room) return;

  const sockets = await io.in(roomCode).fetchSockets();
  for (const socket of sockets) {
    socket.emit(SOCKET_EVENTS.ROOM_STATE, toSnapshot(room, socket.id));
  }
}

export function attachSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    socket.on(SOCKET_EVENTS.ROOM_CREATE, (payload: { playerName?: string }) => {
      const room = createRoom(socket.id, payload?.playerName ?? "Player");
      socket.join(room.code);
      socket.emit(SOCKET_EVENTS.ROOM_STATE, toSnapshot(room, socket.id));
    });

    socket.on(
      SOCKET_EVENTS.ROOM_JOIN,
      (payload: { code?: string; playerName?: string }) => {
        const result = joinRoom(
          socket.id,
          payload?.code ?? "",
          payload?.playerName ?? "Player",
        );

        if ("error" in result) {
          socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: result.error });
          return;
        }

        socket.join(result.room.code);
        void broadcastRoom(io, result.room.code);
      },
    );

    socket.on(SOCKET_EVENTS.GAME_MOVE, (payload: { index?: number }) => {
      const index = payload?.index;
      if (typeof index !== "number") return;

      const result = makeMove(socket.id, index);
      if ("error" in result) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: result.error });
        return;
      }

      void broadcastRoom(io, result.room.code);
    });

    socket.on(SOCKET_EVENTS.GAME_REMATCH, () => {
      const room = requestRematch(socket.id);
      if (!room) return;
      void broadcastRoom(io, room.code);
    });

    socket.on(SOCKET_EVENTS.ROOM_LEAVE, () => {
      const room = leaveRoom(socket.id);
      if (room?.code) {
        socket.leave(room.code);
        void broadcastRoom(io, room.code);
      }
    });

    socket.on("disconnect", () => {
      const room = markDisconnected(socket.id);
      if (room) void broadcastRoom(io, room.code);
    });
  });
}
