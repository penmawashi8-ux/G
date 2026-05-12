import { useEffect, useRef } from "react";
import { useGameStore } from "../../store/gameStore";

export default function GameLog() {
  const log = useGameStore((s) => s.gameState?.log ?? []);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log.length]);

  return (
    <div className="card-base flex flex-col h-40 overflow-y-auto">
      <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-1">ログ</h3>
      <div className="flex flex-col gap-0.5 text-xs text-gray-400 flex-1 overflow-y-auto">
        {log.map((entry, i) => (
          <div key={i} className={`py-0.5 border-b border-gray-800 ${i === log.length - 1 ? "text-white" : ""}`}>
            {entry}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
