import { create } from "zustand";
import { Socket } from "socket.io-client";
import { GameState, ClientToServerEvents, ServerToClientEvents } from "@shared/types";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface GameStore {
  socket: AppSocket | null;
  roomCode: string | null;
  playerId: string | null;
  playerName: string;
  gameState: GameState | null;
  isConnected: boolean;

  setSocket: (s: AppSocket) => void;
  setRoomCode: (code: string) => void;
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setGameState: (state: GameState) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  socket: null,
  roomCode: null,
  playerId: null,
  playerName: "",
  gameState: null,
  isConnected: false,

  setSocket: (s) => set({ socket: s }),
  setRoomCode: (code) => set({ roomCode: code }),
  setPlayerId: (id) => set({ playerId: id }),
  setPlayerName: (name) => set({ playerName: name }),
  setGameState: (state) => set({ gameState: state }),
  setConnected: (connected) => set({ isConnected: connected }),
  reset: () => set({ roomCode: null, playerId: null, gameState: null }),
}));
