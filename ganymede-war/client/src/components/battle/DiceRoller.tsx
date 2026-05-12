import { useState } from "react";
import { motion } from "framer-motion";

interface DiceRollerProps {
  results: number[];
  aim: number;
  rerollsRemaining: number;
  isAttacker: boolean;
  subPhase: string;
  onRoll: () => void;
  onReroll: (indices: number[]) => void;
  onConfirm: () => void;
}

export default function DiceRoller({
  results,
  aim,
  rerollsRemaining,
  isAttacker,
  subPhase,
  onRoll,
  onReroll,
  onConfirm,
}: DiceRollerProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  function toggleDie(i: number) {
    setSelectedIndices((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  }

  function handleReroll() {
    if (selectedIndices.length === 0) return;
    onReroll(selectedIndices);
    setSelectedIndices([]);
  }

  const hits = results.filter((d) => d <= aim).length;

  if (subPhase === "roll" && isAttacker) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-gray-400 text-sm">AIM値: <span className="text-white font-bold">{aim}</span> 以下でヒット</p>
        <button className="btn-primary text-xl px-8 py-4" onClick={onRoll}>
          サイコロを振る!
        </button>
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-gray-400">
        AIM: <span className="text-white font-bold">{aim}</span> 以下でヒット —{" "}
        <span className={hits > 0 ? "text-orange-400 font-bold" : "text-gray-500"}>
          {hits}/{results.length} ヒット
        </span>
      </p>

      {/* Dice display */}
      <div className="flex gap-3 flex-wrap justify-center">
        {results.map((value, i) => {
          const isHit = value <= aim;
          const isSelected = selectedIndices.includes(i);
          return (
            <motion.button
              key={i}
              className={`w-14 h-14 rounded-xl text-2xl font-bold border-2 transition-all
                ${isHit ? "bg-green-900 border-green-500 text-green-300" : "bg-gray-800 border-gray-600 text-gray-400"}
                ${isSelected ? "ring-2 ring-yellow-400 scale-110" : ""}
                ${subPhase === "reroll" ? "cursor-pointer hover:scale-105" : "cursor-default"}
              `}
              onClick={() => subPhase === "reroll" && toggleDie(i)}
              initial={{ rotateX: 360, scale: 0.5 }}
              animate={{ rotateX: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: i * 0.08 }}
            >
              {value}
            </motion.button>
          );
        })}
      </div>

      {/* Reroll / Confirm controls */}
      {isAttacker && subPhase === "reroll" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-yellow-400">
            リロール残り: {rerollsRemaining} 回 — 振り直すサイコロをクリック
          </p>
          <div className="flex gap-2">
            <button
              className="btn-primary"
              onClick={handleReroll}
              disabled={selectedIndices.length === 0}
            >
              振り直す ({selectedIndices.length}個)
            </button>
            <button className="btn-success" onClick={onConfirm}>
              確定
            </button>
          </div>
        </div>
      )}

      {isAttacker && subPhase === "resolve" && (
        <button className="btn-success text-lg px-6" onClick={onConfirm}>
          ダメージ確定
        </button>
      )}

      {!isAttacker && (results.length > 0) && (
        <p className="text-gray-500 text-sm">相手の攻撃を待っています…</p>
      )}
    </div>
  );
}
