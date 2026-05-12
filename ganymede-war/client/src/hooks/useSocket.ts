import { useEffect } from "react";
import { io } from "socket.io-client";
import { useGameStore } from "../store/gameStore";
import { ClientToServerEvents, ServerToClientEvents } from "@shared/types";
import { Socket } from "socket.io-client";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const { socket, setSocket, setPlayerId, setGameState } = useGameStore();

  useEffect(() => {
    if (socket) return;

    const s: AppSocket = io({ path: "/socket.io", transports: ["websocket", "polling"] });

    s.on("connect", () => {
      setPlayerId(s.id ?? "");
      setSocket(s);
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
