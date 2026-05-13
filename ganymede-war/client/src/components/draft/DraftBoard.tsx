import { useGameStore } from "../../store/gameStore";
import { useState } from "react";
import MechCard from "../mech/MechCard";
import PartCardUI from "./PartCardUI";

export default function DraftBoard() {
  const { gameState, playerId, socket } = useGameStore();
  const [hoverPartId, setHoverPartId] = useState<string | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  if (!gameState || !gameState.draftState) return null;

  const draft = gameState.draftState;
  const me = gameState.players.find((p) => p.id === playerId);
  const myTurn = draft.pickOrder[draft.currentPickerIndex] === playerId;

  function pick(cardId: string) {
    if (!myTurn) return;
    socket?.emit("draft_pick", cardId);
    setSelectedPartId(null);
  }

  const stepLabel =
    draft.step === "leader" ? "長機を選択" :
    draft.step === "support" ? "僚機を選択" :
    `パーツを選択 (${draft.partsPickCount}/8)`;
  const allPreviewableParts = [...draft.availableParts, ...(me?.hand ?? [])];
  const hoverPart = allPreviewableParts.find((p) => p.id === hoverPartId) ?? null;
  const selectedPart = allPreviewableParts.find((p) => p.id === selectedPartId) ?? null;
  const previewPart = hoverPart ?? selectedPart;
  const isSelectedInAvailable = draft.availableParts.some((p) => p.id === selectedPartId);

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
          <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-2">パーツ</h3>
          <div className="flex flex-wrap gap-2">
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

      {/* Simulation panel - shown whenever a part is previewed during parts step */}
      {draft.step === "parts" && previewPart && me && me.selectedMechs.length > 0 && (
        <div className="text-sm text-gray-200 rounded-lg border border-cyan-500/40 bg-slate-950/80 p-3">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <span className="text-cyan-300 font-bold">装着シミュレーション: {previewPart.name}</span>
            {myTurn && isSelectedInAvailable && selectedPartId && (
              <button className="btn-primary text-xs px-3 py-1" onClick={() => pick(selectedPartId)}>
                このパーツを選択
              </button>
            )}
          </div>
          {!myTurn && isSelectedInAvailable && selectedPartId && (
            <p className="text-xs text-gray-500 mb-1">（相手のターン中 — 選択はできません）</p>
          )}
          <div className="flex flex-wrap gap-3">
            {me.selectedMechs.map((m) => {
              const s = simulateStats(m);
              if (!s) return null;
              return (
                <div key={m.id} className="px-3 py-2 rounded border border-cyan-600/40 bg-slate-900">
                  <span className="text-white font-semibold">{m.name}</span>
                  <span className="ml-2 text-cyan-100">SP {s.sp} / HP {s.hp} / AIM {s.aim} / 🎲 {s.dice} / ↩ {s.reroll}</span>
                </div>
              );
            })}
          </div>
        </div>
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
