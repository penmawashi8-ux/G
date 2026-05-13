import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";

import {
  ClientToServerEvents,
  ServerToClientEvents,
  GameState,
} from "../../shared/types";

import {
  startDraft,
  applyDraftPick,
  applyAssemblyConfirm,
  forceAssemblyTimeout,
  drawInitiativeCard,
  applySelectDefender,
  applyRollDice,
  applyRerollDice,
  applyResolveAttack,
  applyApplyDamage,
  applyInheritSoul,
} from "./gameEngine";

import {
  createRoom,
  joinRoom,
  addCpuPlayer,
  getRoomByCode,
  getRoomBySocketId,
  getPlayerIdBySocket,
  removePlayerBySocket,
  setAssemblyTimer,
  clearAssemblyTimer,
} from "./gameRoom";

import {
  CPU_ID,
  cpuDraftPick,
  cpuBuildAssembly,
  cpuSelectDefenderMech,
  cpuSelectInherit,
} from "./cpuPlayer";

import { MECH_LEADERS, MECH_SUPPORTS, ALL_PARTS } from "./cardData";

const app = express();
// CORS — CLIENT_URL accepts comma-separated origins (e.g. Vercel + preview URL)
const allowedOrigins: string | string[] = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((s) => s.trim())
  : "*";

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Health check (Railway / uptime monitors)
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Static files — only used when self-hosting (client/dist built locally)
const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  const indexPath = path.join(clientDist, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) res.status(200).json({ status: "ganymede-war server" });
  });
});

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: allowedOrigins },
});

function broadcast(roomCode: string, state: GameState) {
  io.to(roomCode).emit("game_state", state);
}

// Schedules a single CPU action based on the current game phase/subphase.
// Call after every state mutation in a CPU room.
function processCpuTurn(roomCode: string) {
  const room = getRoomByCode(roomCode);
  if (!room || !room.state.hasCpu) return;

  const state = room.state;

  // Draft
  if (state.phase === "draft" && state.draftState) {
    const pickerId = state.draftState.pickOrder[state.draftState.currentPickerIndex];
    if (pickerId === CPU_ID) {
      setTimeout(() => {
        const r = getRoomByCode(roomCode);
        if (!r || r.state.phase !== "draft") return;
        if (r.state.draftState?.pickOrder[r.state.draftState.currentPickerIndex] !== CPU_ID) return;
        const cardId = cpuDraftPick(r.state);
        if (!cardId) return;
        r.state = applyDraftPick(r.state, CPU_ID, cardId);
        if (r.state.phase === "assembly") {
          setAssemblyTimer(r, () => {
            r.state = forceAssemblyTimeout(r.state);
            broadcast(r.code, r.state);
          });
        }
        broadcast(r.code, r.state);
        processCpuTurn(roomCode);
      }, 900);
    }
    return;
  }

  // Assembly
  if (state.phase === "assembly" && state.assemblyData) {
    if (!state.assemblyData.confirmed.includes(CPU_ID)) {
      setTimeout(() => {
        const r = getRoomByCode(roomCode);
        if (!r || r.state.phase !== "assembly") return;
        if (r.state.assemblyData?.confirmed.includes(CPU_ID)) return;
        const payload = cpuBuildAssembly(r.state);
        r.state = applyAssemblyConfirm(r.state, CPU_ID, payload);
        if (r.state.phase === "battle") clearAssemblyTimer(r);
        broadcast(r.code, r.state);
        processCpuTurn(roomCode);
      }, 900);
    }
    return;
  }

  // Battle
  if (state.phase === "battle" && state.battleRound) {
    const br = state.battleRound;

    if (br.subPhase === "draw") {
      // CPU auto-draws (any player can draw; only do it if it's a CPU-only action needed)
      // We auto-draw only when the CPU is the attacker of the *next* card or general draw
      setTimeout(() => {
        const r = getRoomByCode(roomCode);
        if (!r || r.state.battleRound?.subPhase !== "draw") return;
        r.state = drawInitiativeCard(r.state);
        broadcast(r.code, r.state);
        processCpuTurn(roomCode);
      }, 1500);
      return;
    }

    if (br.subPhase === "roll" && br.attackPlayerId === CPU_ID) {
      setTimeout(() => {
        const r = getRoomByCode(roomCode);
        if (!r || r.state.battleRound?.subPhase !== "roll") return;
        if (r.state.battleRound?.attackPlayerId !== CPU_ID) return;
        r.state = applyRollDice(r.state);
        broadcast(r.code, r.state);
        processCpuTurn(roomCode);
      }, 1400);
      return;
    }

    if (br.subPhase === "reroll" && br.attackPlayerId === CPU_ID) {
      setTimeout(() => {
        const r = getRoomByCode(roomCode);
        if (!r || r.state.battleRound?.subPhase !== "reroll") return;
        if (r.state.battleRound?.attackPlayerId !== CPU_ID) return;
        r.state = applyResolveAttack(r.state);
        broadcast(r.code, r.state);
        processCpuTurn(roomCode);
      }, 1400);
      return;
    }


    if (br.subPhase === "selectDefender" && br.defensePlayerId === CPU_ID) {
      setTimeout(() => {
        const r = getRoomByCode(roomCode);
        if (!r || r.state.battleRound?.subPhase !== "selectDefender") return;
        if (r.state.battleRound?.defensePlayerId !== CPU_ID) return;
        const mechId = cpuSelectDefenderMech(r.state);
        if (!mechId) return;
        r.state = applySelectDefender(r.state, mechId);
        if (r.state.battleRound?.pendingHits && r.state.battleRound.pendingHits > 0) {
          r.state = applyApplyDamage(r.state);
        } else {
          r.state = { ...r.state, battleRound: r.state.battleRound ? { ...r.state.battleRound, subPhase: "draw" } : null };
        }
        broadcast(r.code, r.state);
        processCpuTurn(roomCode);
      }, 1400);
      return;
    }

    if (br.subPhase === "resolve" && br.attackPlayerId === CPU_ID) {
      setTimeout(() => {
        const r = getRoomByCode(roomCode);
        if (!r || r.state.battleRound?.subPhase !== "resolve") return;
        if (r.state.battleRound?.attackPlayerId !== CPU_ID) return;
        r.state = applyResolveAttack(r.state);
        broadcast(r.code, r.state);
        processCpuTurn(roomCode);
      }, 1400);
      return;
    }
    if (br.subPhase === "inherit" && br.inheritPlayerId === CPU_ID) {
      setTimeout(() => {
        const r = getRoomByCode(roomCode);
        if (!r || r.state.battleRound?.subPhase !== "inherit") return;
        if (r.state.battleRound?.inheritPlayerId !== CPU_ID) return;
        const mechId = cpuSelectInherit(r.state);
        r.state = applyInheritSoul(r.state, mechId);
        broadcast(r.code, r.state);
        processCpuTurn(roomCode);
      }, 1400);
      return;
    }
  }
}

io.on("connection", (socket) => {
  console.log(`connected: ${socket.id}`);

  // ── ルーム作成 ──────────────────────────────────────
  socket.on("create_room", (playerName, cb) => {
    const room = createRoom(socket.id, playerName);
    socket.join(room.code);
    cb(room.code);
    broadcast(room.code, room.state);
  });

  // ── CPU対戦ルーム作成 ────────────────────────────
  socket.on("create_cpu_room", (playerName, cb) => {
    const room = createRoom(socket.id, playerName);
    socket.join(room.code);
    addCpuPlayer(room);
    cb(room.code);
    broadcast(room.code, room.state);
    processCpuTurn(room.code);
  });

  // ── ルーム参加 ──────────────────────────────────────
  socket.on("join_room", ({ roomCode, playerName }, cb) => {
    const { room, error } = joinRoom(roomCode, socket.id, playerName);
    if (error || !room) { cb(error ?? "Unknown error"); return; }
    socket.join(room.code);
    cb();

    if (room.state.players.length === 2) {
      const playerIds = room.state.players.map((p) => p.id);
      room.state = {
        ...room.state,
        phase: "draft",
        draftState: startDraft(MECH_LEADERS, MECH_SUPPORTS, ALL_PARTS, playerIds),
        log: ["ドラフト開始！"],
      };
    }
    broadcast(room.code, room.state);
  });

  // ── ドラフト ──────────────────────────────────────
  socket.on("draft_pick", (cardId) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    const playerId = getPlayerIdBySocket(room, socket.id);
    if (!playerId) return;

    room.state = applyDraftPick(room.state, playerId, cardId);

    if (room.state.phase === "assembly") {
      setAssemblyTimer(room, () => {
        room.state = forceAssemblyTimeout(room.state);
        broadcast(room.code, room.state);
      });
    }
    broadcast(room.code, room.state);
    processCpuTurn(room.code);
  });

  // ── アセンブリ確定 ────────────────────────────────
  socket.on("assembly_confirm", (payload) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    const playerId = getPlayerIdBySocket(room, socket.id);
    if (!playerId) return;

    room.state = applyAssemblyConfirm(room.state, playerId, payload);

    if (room.state.phase === "battle") clearAssemblyTimer(room);
    broadcast(room.code, room.state);
    processCpuTurn(room.code);
  });

  // ── 防御メック選択 ────────────────────────────────
  socket.on("select_defender", (mechId) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    const playerId = getPlayerIdBySocket(room, socket.id);
    if (!playerId) return;
    const br = room.state.battleRound;
    if (!br || br.defensePlayerId !== playerId || br.subPhase !== "selectDefender") return;

    room.state = applySelectDefender(room.state, mechId);
    if (room.state.battleRound?.pendingHits && room.state.battleRound.pendingHits > 0) {
      room.state = applyApplyDamage(room.state);
    } else {
      room.state = { ...room.state, battleRound: room.state.battleRound ? { ...room.state.battleRound, subPhase: "draw" } : null };
    }
    broadcast(room.code, room.state);
    processCpuTurn(room.code);
  });

  // ── サイコロを振る / カードを引く ─────────────────
  socket.on("roll_dice", () => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    const playerId = getPlayerIdBySocket(room, socket.id);
    if (!playerId) return;
    const br = room.state.battleRound;
    if (!br) return;

    if (br.subPhase === "draw") {
      // どちらのプレイヤーも引ける
      room.state = drawInitiativeCard(room.state);
    } else if (br.subPhase === "roll" && br.attackPlayerId === playerId) {
      room.state = applyRollDice(room.state);
    }
    broadcast(room.code, room.state);
    processCpuTurn(room.code);
  });

  // ── リロール / 攻撃確定 ──────────────────────────
  socket.on("reroll_dice", (indices) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    const playerId = getPlayerIdBySocket(room, socket.id);
    if (!playerId) return;
    const br = room.state.battleRound;
    if (!br || br.attackPlayerId !== playerId) return;

    if (indices.length === 0) {
      // 確定ボタン: resolve へ
      if (br.subPhase === "reroll" || br.subPhase === "resolve") {
        room.state = applyResolveAttack(room.state);
      }
    } else if (br.subPhase === "reroll") {
      room.state = applyRerollDice(room.state, indices);
    }
    broadcast(room.code, room.state);
    processCpuTurn(room.code);
  });

  socket.on("resolve_attack", () => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    const playerId = getPlayerIdBySocket(room, socket.id);
    if (!playerId) return;
    const br = room.state.battleRound;
    if (room.state.phase !== "battle" || !br) return;
    if (br.subPhase !== "resolve" || br.attackPlayerId !== playerId) return;

    room.state = applyResolveAttack(room.state);
    broadcast(room.code, room.state);
    processCpuTurn(room.code);
  });

  // ── 魂の継承 ────────────────────────────────────
  socket.on("inherit_soul", (targetMechId) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    const playerId = getPlayerIdBySocket(room, socket.id);
    if (!playerId) return;
    const br = room.state.battleRound;
    if (!br || br.subPhase !== "inherit" || br.inheritPlayerId !== playerId) return;

    room.state = applyInheritSoul(room.state, targetMechId);
    broadcast(room.code, room.state);
    processCpuTurn(room.code);
  });

  // ── 切断 ──────────────────────────────────────
  socket.on("disconnect", () => {
    console.log(`disconnected: ${socket.id}`);
    const room = removePlayerBySocket(socket.id);
    if (!room) return;
    if (room.state.phase !== "lobby" && room.state.phase !== "ended") {
      const remaining = room.state.players.find((p) => p.id !== socket.id);
      if (remaining) {
        room.state = {
          ...room.state,
          phase: "ended",
          winnerId: remaining.id,
          log: [...room.state.log, "相手が切断しました"],
        };
        broadcast(room.code, room.state);
      }
    }
  });
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => console.log(`Server running on :${PORT}`));
