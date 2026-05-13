import { useSocket } from "./hooks/useSocket";
import { useGameStore } from "./store/gameStore";
import Lobby from "./components/ui/Lobby";
import DraftBoard from "./components/draft/DraftBoard";
import MechAssembly from "./components/mech/MechAssembly";
import BattleField from "./components/battle/BattleField";
import GameOver from "./components/ui/GameOver";
import UpdatePrompt from "./components/UpdatePrompt";

export default function App() {
  useSocket();

  const { gameState, isConnected } = useGameStore();
  const phase = gameState?.phase;

  return (
    <div className="min-h-screen flex flex-col">
      {!isConnected && (
        <div className="fixed inset-x-0 top-0 z-50 bg-red-700 text-white text-center py-2 text-sm font-bold animate-pulse">
          サーバーに接続できません — 再接続中...
        </div>
      )}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-widest text-blue-400">
          GANYMEDE WAR <span className="text-gray-500 text-sm">ZERO+</span>
        </h1>
        {gameState && (
          <span className="text-xs text-gray-500 uppercase tracking-widest">
            {phase} | {gameState.roomCode}
          </span>
        )}
      </header>

      <main className="flex-1 overflow-auto">
        {(!gameState || phase === "lobby") && <Lobby />}
        {phase === "draft" && <DraftBoard />}
        {phase === "assembly" && <MechAssembly />}
        {phase === "battle" && <BattleField />}
        {phase === "ended" && <GameOver />}
      </main>
      <UpdatePrompt />
    </div>
  );
}
