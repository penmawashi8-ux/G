import { useGameStore } from "../../store/gameStore";
import { useState } from "react";
import MechCard from "../mech/MechCard";
import PartCardUI from "./PartCardUI";

export default function DraftBoard() {
  const { gameState, playerId, socket } = useGameStore();
  const [hoverPartId, setHoverPartId] = useState<string | null>(null);
  if (!gameState || !gameState.draftState) return null;

  const draft = gameState.draftState;
  const me = gameState.players.find((p) => p.id === playerId);
  const myTurn = draft.pickOrder[draft.currentPickerIndex] === playerId;

  function pick(cardId: string) {
    if (!myTurn) return;
    socket?.emit("draft_pick", cardId);
  }

  const stepLabel =
    draft.step === "leader" ? "長機を選択" :
    draft.step === "support" ? "僚機を選択" :
    `パーツを選択 (${draft.partsPickCount}/8)`;
  const hoverPart = draft.availableParts.find((p) => p.id === hoverPartId) ?? null;

  function simulateStats(mech: { baseStats: { sp: number; hp: number; aim: number; dice: number; reroll: number } }) {
    if (!hoverPart) return null;
    const b = mech.baseStats;
    return {
      sp: b.sp + hoverPart.spMod,
      hp: b.hp + hoverPart.hpMod,
      aim: b.aim + hoverPart.aimMod,
      dice: b.dice + hoverPart.bonusDice,
      reroll: b.reroll + hoverPart.bonusReroll,
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
                <PartCardUI part={part} onClick={() => pick(part.id)} disabled={!myTurn} />
              </div>
            ))}
          </div>
          {hoverPart && me && me.selectedMechs.length > 0 && (
            <div className="mt-3 text-xs text-gray-300">
              <span className="text-blue-300 font-bold">装着シミュレーション: {hoverPart.name}</span>
              <div className="flex flex-wrap gap-3 mt-1">
                {me.selectedMechs.map((m) => {
                  const s = simulateStats(m);
                  if (!s) return null;
                  return (
                    <div key={m.id} className="px-2 py-1 rounded border border-gray-700">
                      <span className="text-white">{m.name}</span>
                      <span className="ml-2">SP {s.sp} / HP {s.hp} / AIM {s.aim} / 🎲 {s.dice} / ↩ {s.reroll}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
              <PartCardUI key={part.id} part={part} />
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
