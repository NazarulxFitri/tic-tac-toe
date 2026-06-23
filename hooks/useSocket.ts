"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getSocketUrl } from "@/lib/online";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const instance = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    setSocket(instance);
    setConnecting(!instance.connected);

    const onConnect = () => {
      setConnected(true);
      setConnecting(false);
      setError(null);
    };

    const onDisconnect = () => {
      setConnected(false);
      setConnecting(false);
    };

    const onConnectError = () => {
      setConnected(false);
      setConnecting(false);
      setError(
        "Could not connect to the game server. Restart with yarn dev or npm run dev.",
      );
    };

    instance.on("connect", onConnect);
    instance.on("disconnect", onDisconnect);
    instance.on("connect_error", onConnectError);

    return () => {
      instance.off("connect", onConnect);
      instance.off("disconnect", onDisconnect);
      instance.off("connect_error", onConnectError);
      instance.disconnect();
    };
  }, []);

  return { socket, connected, connecting, error };
}
