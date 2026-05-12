import { motion } from "framer-motion";
import { InitiativeCard } from "@shared/types";

interface Props {
  card: InitiativeCard | null;
  deckCount: number;
  discardCount: number;
  attackerName: string;
  defenderName: string;
  onDraw?: () => void;
  canDraw: boolean;
}

export default function InitiativeCardUI({
  card,
  deckCount,
  discardCount,
  attackerName,
  defenderName,
  onDraw,
  canDraw,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-8 items-center">
        {/* Deck */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-20 h-28 rounded-lg border-2 border-gray-600 bg-gray-800 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-400">{deckCount}</span>
          </div>
          <span className="text-xs text-gray-500">山札</span>
        </div>

        {/* Current card */}
        <div className="flex flex-col items-center gap-1">
          {card ? (
            <motion.div
              key={card.id}
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-24 h-32 rounded-xl border-2 border-blue-500 bg-blue-950 flex flex-col items-center justify-center gap-2 shadow-lg shadow-blue-900"
            >
              <span className="text-xs text-gray-400 uppercase">{card.direction === "right" ? "▶ 右" : "◀ 左"}</span>
              <span className="text-sm font-bold text-white text-center px-1 leading-tight">
                {attackerName}
              </span>
            </motion.div>
          ) : (
            <div className="w-24 h-32 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center">
              {canDraw ? (
                <button
                  className="btn-primary text-sm"
                  onClick={onDraw}
                >
                  引く
                </button>
              ) : (
                <span className="text-gray-600 text-xs text-center px-2">相手のターン</span>
              )}
            </div>
          )}
          <span className="text-xs text-gray-500">公開中</span>
        </div>

        {/* Discard */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-20 h-28 rounded-lg border-2 border-gray-700 bg-gray-900 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-600">{discardCount}</span>
          </div>
          <span className="text-xs text-gray-500">捨て札</span>
        </div>
      </div>

      {card && (
        <div className="text-center">
          <span className="text-orange-400 font-bold">{attackerName}</span>
          <span className="text-gray-400"> が攻撃 → </span>
          <span className="text-blue-400 font-bold">{defenderName}</span>
          <span className="text-gray-400"> が防御側</span>
        </div>
      )}
    </div>
  );
}
