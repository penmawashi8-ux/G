import { GameState } from "../../shared/types";
import { generateRoomCode, createInitialGameState, startDraft } from "./gameEngine";
import { MECH_LEADERS, MECH_SUPPORTS, ALL_PARTS } from "./cardData";
import { CPU_ID } from "./cpuPlayer";

interface Room {
  code: string;
  state: GameState;
  assemblyTimer: NodeJS.Timeout | null;
  socketToPlayer: Map<string, string>; // socketId → playerId
}

const rooms = new Map<string, Room>();

export function createRoom(socketId: string, playerName: string): Room {
  const code = generateRoomCode();
  const playerId = socketId;
  const state = createInitialGameState(code);
  state.players.push({
    id: playerId,
    name: playerName,
    isCpu: false,
    mechs: [],
    hand: [],
    selectedMechs: [],
    isReady: false,
  });

  const room: Room = {
    code,
    state,
    assemblyTimer: null,
    socketToPlayer: new Map([[socketId, playerId]]),
  };
  rooms.set(code, room);
  return room;
}

export function addCpuPlayer(room: Room): void {
  room.state.hasCpu = true;
  room.state.players.push({
    id: CPU_ID,
    name: "CPU",
    isCpu: true,
    mechs: [],
    hand: [],
    selectedMechs: [],
    isReady: false,
  });
  const playerIds = room.state.players.map((p) => p.id);
  room.state = {
    ...room.state,
    phase: "draft",
    draftState: startDraft(MECH_LEADERS, MECH_SUPPORTS, ALL_PARTS, playerIds),
    log: ["ドラフト開始！"],
  };
}

export function joinRoom(
  code: string,
  socketId: string,
  playerName: string
): { room: Room; error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { room: null as unknown as Room, error: "ルームが見つかりません" };
  if (room.state.players.length >= 2) return { room: null as unknown as Room, error: "ルームが満員です" };

  const playerId = socketId;
  room.state.players.push({
    id: playerId,
    name: playerName,
    isCpu: false,
    mechs: [],
    hand: [],
    selectedMechs: [],
    isReady: false,
  });
  room.socketToPlayer.set(socketId, playerId);
  return { room };
}

export function getRoomByCode(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function getRoomBySocketId(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.socketToPlayer.has(socketId)) return room;
  }
  return undefined;
}

export function getPlayerIdBySocket(room: Room, socketId: string): string | undefined {
  return room.socketToPlayer.get(socketId);
}

export function removePlayerBySocket(socketId: string): Room | undefined {
  const room = getRoomBySocketId(socketId);
  if (!room) return undefined;
  room.socketToPlayer.delete(socketId);
  if (room.socketToPlayer.size === 0) {
    if (room.assemblyTimer) clearTimeout(room.assemblyTimer);
    rooms.delete(room.code);
  }
  return room;
}

export function setAssemblyTimer(room: Room, cb: () => void): void {
  if (room.assemblyTimer) clearTimeout(room.assemblyTimer);
  const ms = Math.max(0, room.state.assemblyData!.deadline - Date.now());
  room.assemblyTimer = setTimeout(cb, ms);
}

export function clearAssemblyTimer(room: Room): void {
  if (room.assemblyTimer) {
    clearTimeout(room.assemblyTimer);
    room.assemblyTimer = null;
  }
}
