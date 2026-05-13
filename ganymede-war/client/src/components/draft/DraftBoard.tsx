import { useGameStore } from "../../store/gameStore";
import { useState, useEffect, useRef } from "react";
import MechCard from "../mech/MechCard";
import PartCardUI from "./PartCardUI";
import { PartCard, MechCard as MechCardType } from "@shared/types";

export default function DraftBoard() {
  const { gameState, playerId, socket } = useGameStore();
  const [hoverPartId, setHoverPartId] = useState<string | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [batchFlash, setBatchFlash] = useState(false);
  const prevBatchRef = useRef(0);

  const draft = gameState?.draftState;
  const batchNum = draft?.step === "parts" ? Math.floor((draft.partsPickCount ?? 0) / 4) + 1 : 1;

  useEffect(() => {
    if (!draft || draft.step !== "parts") return;
    if (batchNum > prevBatchRef.current && prevBatchRef.current !== 0) {
      setBatchFlash(true);
      const t = setTimeout(() => setBatchFlash(false), 2500);
      return () => clearTimeout(t);
    }
    prevBatchRef.current = batchNum;
  }, [batchNum, draft?.step]);

  if (!gameState || !draft) return null;

  const me = gameState.players.find((p) => p.id === playerId);
  const myTurn = draft.pickOrder[draft.currentPickerIndex] === playerId;

  function pick(cardId: string) {
    if (!myTurn) return;
    socket?.emit("draft_pick", cardId);
    setSelectedPartId(null);
  }

  const picksLeftInBatch = 4 - (draft.partsPickInBatch ?? 0);
  const stepLabel =
    draft.step === "leader" ? "長機を選択" :
    draft.step === "support" ? "僚機を選択" :
    `パーツを選択 — ${batchNum}巡目`;
  const allPreviewableParts = [...draft.availableParts, ...(me?.hand ?? [])];
  const hoverPart = allPreviewableParts.find((p) => p.id === hoverPartId) ?? null;
  const selectedPart = allPreviewableParts.find((p) => p.id === selectedPartId) ?? null;
  const previewPart = hoverPart ?? selectedPart;
  const isSelectedInAvailable = draft.availableParts.some((p) => p.id === selectedPartId);
  const activePreviewId = hoverPartId ?? selectedPartId;
  const isPreviewFromHand = !!(activePreviewId && me?.hand.some((p) => p.id === activePreviewId));

  function simulateStats(mech: { baseStats: { sp: number; hp: number; aim: number; dice: number; reroll: number } }) {
    if (!previewPart) return null;
    const b = mech.baseStats;
    return {
      sp: b.sp + previewPart.spMod,
      hp: b.hp + previewPart.hpMod,
      aim: b.aim + previewPart.aimMod,
      dice: b.dice + previewPart.bonusDice,
      reroll: b.reroll + previewPart.bonusReroll,
    };
  }

  return (
    <div className="p-4 flex flex-col gap-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-blue-400">ドラフト — {stepLabel}</h2>
        <div className={`px-3 py-1 rounded text-sm font-bold ${myTurn ? "bg-green-700 text-white animate-pulse" : "bg-gray-700 text-gray-400"}`}>
          {myTurn ? "あなたのターン" : "相手のターン"}
        </div>
      </div>

      {/* Available cards */}
      {draft.step === "leader" && (
        <div>
          <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-2">長機 (4枚中2枚選択)</h3>
          <div className="flex flex-wrap gap-3">
            {draft.availableLeaders.map((mech) => (
              <MechCard key={mech.id} mech={mech} onClick={() => pick(mech.id)} disabled={!myTurn} />
            ))}
          </div>
        </div>
      )}

      {draft.step === "support" && (
        <div>
          <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-2">僚機 (4枚中2枚選択)</h3>
          <div className="flex flex-wrap gap-3">
            {draft.availableSupports.map((mech) => (
              <MechCard key={mech.id} mech={mech} onClick={() => pick(mech.id)} disabled={!myTurn} />
            ))}
          </div>
        </div>
      )}

      {draft.step === "parts" && (
        <div>
          {batchFlash && (
            <div className="mb-2 py-2 px-4 rounded-lg bg-cyan-700 text-white text-center font-bold animate-pulse">
              🔄 {batchNum}巡目 — 新しい10枚！
            </div>
          )}
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${batchNum === 1 ? "bg-blue-800 text-blue-200" : "bg-purple-800 text-purple-200"}`}>
              {batchNum}巡目
            </span>
            <span className="text-xs text-gray-500">
              残り{picksLeftInBatch}ピックで次へ
            </span>
            <span className="text-xs text-gray-600">{draft.availableParts.length}枚表示中</span>
          </div>
          <div key={batchNum} className="flex flex-wrap gap-1.5">
            {draft.availableParts.map((part) => (
              <div key={part.id} onMouseEnter={() => setHoverPartId(part.id)} onMouseLeave={() => setHoverPartId(null)}>
                <PartCardUI
                  part={part}
                  onClick={() => {
                    if (myTurn && selectedPartId === part.id) {
                      pick(part.id);
                    } else {
                      setSelectedPartId(selectedPartId === part.id ? null : part.id);
                    }
                  }}
                  disabled={!myTurn}
                  selected={selectedPartId === part.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation panel for AVAILABLE parts — above 取得済み, no layout shift when tapping hand parts */}
      {draft.step === "parts" && previewPart && !isPreviewFromHand && me && me.selectedMechs.length > 0 && (
        <SimulationPanel
          part={previewPart}
          mechs={me.selectedMechs}
          simulateStats={simulateStats}
          showPickButton={myTurn && isSelectedInAvailable && !!selectedPartId}
          showNotMyTurn={!myTurn && isSelectedInAvailable && !!selectedPartId}
          onPick={() => selectedPartId && pick(selectedPartId)}
        />
      )}

      {/* My collection */}
      {me && (
        <div className="border-t border-gray-800 pt-4">
          <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-2">取得済み</h3>
          <div className="flex flex-wrap gap-2 items-start">
            {me.selectedMechs.map((mech) => (
              <MechCard key={mech.id} mech={mech} />
            ))}
            {me.hand.map((part) => (
              <div key={part.id} onMouseEnter={() => setHoverPartId(part.id)} onMouseLeave={() => setHoverPartId(null)}>
                <PartCardUI
                  part={part}
                  onClick={() => setSelectedPartId(selectedPartId === part.id ? null : part.id)}
                  selected={selectedPartId === part.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation panel for HAND parts — below 取得済み so tapping hand parts never causes layout shift above */}
      {draft.step === "parts" && previewPart && isPreviewFromHand && me && me.selectedMechs.length > 0 && (
        <SimulationPanel
          part={previewPart}
          mechs={me.selectedMechs}
          simulateStats={simulateStats}
          showPickButton={false}
          showNotMyTurn={false}
          onPick={() => {}}
        />
      )}

      {/* Other players */}
      {gameState.players.filter((p) => p.id !== playerId).map((opponent) => (
        <div key={opponent.id} className="border-t border-gray-800 pt-3">
          <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-2">{opponent.name} の取得済み</h3>
          <div className="flex flex-wrap gap-2 items-start">
            {opponent.selectedMechs.map((mech) => (
              <MechCard key={mech.id} mech={mech} />
            ))}
            <span className="text-sm text-gray-600">{opponent.hand.length}枚のパーツ</span>
          </div>
        </div>
      ))}
    </div>
  );
}

interface SimPanelProps {
  part: PartCard;
  mechs: MechCardType[];
  simulateStats: (mech: { baseStats: { sp: number; hp: number; aim: number; dice: number; reroll: number } }) => { sp: number; hp: number; aim: number; dice: number; reroll: number } | null;
  showPickButton: boolean;
  showNotMyTurn: boolean;
  onPick: () => void;
}

function SimulationPanel({ part, mechs, simulateStats, showPickButton, showNotMyTurn, onPick }: SimPanelProps) {
  return (
    <div className="text-sm text-gray-200 rounded-lg border border-cyan-500/40 bg-slate-950/80 p-3">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <span className="text-cyan-300 font-bold">装着シミュレーション: {part.name}</span>
        {showPickButton && (
          <button className="btn-primary text-xs px-3 py-1" onClick={onPick}>
            このパーツを選択
          </button>
        )}
      </div>
      {showNotMyTurn && (
        <p className="text-xs text-gray-500 mb-1">（相手のターン中 — 選択はできません）</p>
      )}
      <div className="flex flex-wrap gap-3">
        {mechs.map((m) => {
          const s = simulateStats(m);
          if (!s) return null;
          return (
            <div key={m.id} className="px-3 py-2 rounded border border-cyan-600/40 bg-slate-900">
              <div className="text-white font-semibold mb-1">{m.name}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                <StatCell label="SP"  value={s.sp}     mod={part.spMod} />
                <StatCell label="HP"  value={s.hp}     mod={part.hpMod} />
                <StatCell label="AIM" value={s.aim}    mod={part.aimMod} />
                <StatCell label="🎲"  value={s.dice}   mod={part.bonusDice} />
                <StatCell label="↩"   value={s.reroll} mod={part.bonusReroll} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCell({ label, value, mod }: { label: string; value: number; mod: number }) {
  const valClass = mod > 0 ? "text-green-400 font-bold" : mod < 0 ? "text-red-400 font-bold" : "text-gray-300";
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="text-gray-500">{label}</span>
      <span className={valClass}>{value}</span>
      {mod !== 0 && (
        <span className={`text-xs ${mod > 0 ? "text-green-400" : "text-red-400"}`}>
          ({mod > 0 ? "+" : ""}{mod})
        </span>
      )}
    </span>
  );
}
