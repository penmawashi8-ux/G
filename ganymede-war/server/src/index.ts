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
  applyInheritSoul,
} from "./gameEngine";

import {
  createRoom,
  joinRoom,
  getRoomBySocketId,
  getPlayerIdBySocket,
  removePlayerBySocket,
  setAssemblyTimer,
  clearAssemblyTimer,
} from "./gameRoom";

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

io.on("connection", (socket) => {
  console.log(`connected: ${socket.id}`);

  // ── ルーム作成 ──────────────────────────────────────
  socket.on("create_room", (playerName, cb) => {
    const room = createRoom(socket.id, playerName);
    socket.join(room.code);
    cb(room.code);
    broadcast(room.code, room.state);
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
    broadcast(room.code, room.state);
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
