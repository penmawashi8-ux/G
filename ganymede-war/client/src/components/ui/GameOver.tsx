import { useGameStore } from "../../store/gameStore";

export default function GameOver() {
  const { gameState, playerId, reset } = useGameStore();
  if (!gameState) return null;

  const me = gameState.players.find((p) => p.id === playerId);
  const winner = gameState.players.find((p) => p.id === gameState.winnerId);
  const isWinner = gameState.winnerId === playerId;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
      <div className={`text-6xl font-extrabold tracking-widest ${isWinner ? "text-yellow-400" : "text-red-500"}`}>
        {isWinner ? "VICTORY" : "DEFEAT"}
      </div>
      {winner && (
        <p className="text-gray-300 text-xl">
          勝者: <span className="text-white font-bold">{winner.name}</span>
        </p>
      )}
      <div className="card-base w-full max-w-md">
        <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-2">バトルログ</h3>
        <div className="flex flex-col gap-1 text-sm text-gray-300 max-h-48 overflow-y-auto">
          {gameState.log.map((entry, i) => (
            <div key={i} className="border-b border-gray-800 py-1">{entry}</div>
          ))}
        </div>
      </div>
      <button className="btn-primary text-lg px-8" onClick={reset}>
        タイトルに戻る
      </button>
    </div>
  );
}
