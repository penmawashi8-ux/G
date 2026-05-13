import { useEffect } from "react";
import { io } from "socket.io-client";
import { useGameStore } from "../store/gameStore";
import { ClientToServerEvents, ServerToClientEvents } from "@shared/types";
import { Socket } from "socket.io-client";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const { socket, setSocket, setPlayerId, setGameState, setConnected } = useGameStore();

  useEffect(() => {
    if (socket) return;

    // VITE_SERVER_URL = Railway URL in production; empty = same-origin (dev proxy)
    const serverUrl = import.meta.env.VITE_SERVER_URL ?? "";
    const s: AppSocket = io(serverUrl, { path: "/socket.io", transports: ["websocket", "polling"] });

    s.on("connect", () => {
      setPlayerId(s.id ?? "");
      setSocket(s);
      setConnected(true);
    });

    s.on("disconnect", () => {
      setConnected(false);
    });

    s.on("connect_error", () => {
      setConnected(false);
    });

    s.on("game_state", (state) => {
      setGameState(state);
    });

    s.on("error", (msg) => {
      console.error("Server error:", msg);
    });

    return () => {
      s.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useGameStore((s) => s.socket);
}
