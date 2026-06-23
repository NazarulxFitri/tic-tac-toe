"use client";

import { useCallback, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS, type RoomSnapshot } from "@/lib/online";

export function useOnlineGame(socket: Socket | null, connected: boolean) {
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onRoomState = (snapshot: RoomSnapshot) => {
      setRoom(snapshot);
      setError(null);
    };

    const onRoomError = (payload: { message?: string }) => {
      setError(payload.message ?? "Something went wrong.");
    };

    socket.on(SOCKET_EVENTS.ROOM_STATE, onRoomState);
    socket.on(SOCKET_EVENTS.ROOM_ERROR, onRoomError);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_STATE, onRoomState);
      socket.off(SOCKET_EVENTS.ROOM_ERROR, onRoomError);
    };
  }, [socket]);

  const createRoom = useCallback(
    (playerName: string) => {
      if (!socket || !connected) {
        setError("Not connected to the game server.");
        return;
      }
      setError(null);
      socket.emit(SOCKET_EVENTS.ROOM_CREATE, { playerName });
    },
    [socket, connected],
  );

  const joinRoom = useCallback(
    (code: string, playerName: string) => {
      if (!socket || !connected) {
        setError("Not connected to the game server.");
        return;
      }
      setError(null);
      socket.emit(SOCKET_EVENTS.ROOM_JOIN, { code, playerName });
    },
    [socket, connected],
  );

  const makeMove = useCallback(
    (index: number) => {
      if (!socket || !connected) return;
      socket.emit(SOCKET_EVENTS.GAME_MOVE, { index });
    },
    [socket, connected],
  );

  const requestRematch = useCallback(() => {
    if (!socket || !connected) return;
    socket.emit(SOCKET_EVENTS.GAME_REMATCH);
  }, [socket, connected]);

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit(SOCKET_EVENTS.ROOM_LEAVE);
    setRoom(null);
    setError(null);
  }, [socket]);

  const resetSession = useCallback(() => {
    setRoom(null);
    setError(null);
  }, []);

  return {
    room,
    error,
    createRoom,
    joinRoom,
    makeMove,
    requestRematch,
    leaveRoom,
    resetSession,
  };
}
