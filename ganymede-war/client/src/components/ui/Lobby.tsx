import { useState } from "react";
import { useGameStore } from "../../store/gameStore";

export default function Lobby() {
  const { socket, playerName, setPlayerName, setRoomCode, gameState } = useGameStore();
  const [mode, setMode] = useState<"home" | "create" | "join">("home");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const isConnected = !!socket;
  const isWaiting = gameState?.phase === "lobby" && (gameState.players.length ?? 0) === 1;

  function handleCreate() {
    if (!socket || !playerName.trim()) return;
    socket.emit("create_room", playerName.trim(), (code) => {
      setRoomCode(code);
    });
  }

  function handleCpuGame() {
    if (!socket || !playerName.trim()) return;
    socket.emit("create_cpu_room", playerName.trim(), (code) => {
      setRoomCode(code);
    });
  }

  function handleJoin() {
    if (!socket || !playerName.trim() || !joinCode.trim()) return;
    setError("");
    socket.emit("join_room", { roomCode: joinCode.toUpperCase(), playerName: playerName.trim() }, (err) => {
      if (err) setError(err);
    });
  }

  if (isWaiting) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[80vh] gap-6">
        <div className="text-4xl font-bold text-blue-400 tracking-widest">
          {gameState?.roomCode}
        </div>
        <p className="text-gray-400">このコードを相手に送ってください</p>
        <div className="flex gap-2 items-center text-gray-500">
          <span className="animate-pulse w-2 h-2 rounded-full bg-yellow-400 inline-block" />
          相手の接続を待っています…
        </div>
        <button
          className="btn-ghost text-sm mt-4"
          onClick={() => navigator.clipboard.writeText(gameState?.roomCode ?? "")}
        >
          コードをコピー
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[80vh] gap-8 px-4">
      <div className="text-center">
        <h2 className="text-5xl font-extrabold tracking-widest text-blue-400 mb-2">
          MECH SIEGE
        </h2>
        <p className="text-gray-500 text-sm tracking-widest">ZERO+</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <label className="text-xs text-gray-400 uppercase tracking-widest">プレイヤー名</label>
        <input
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          placeholder="名前を入力..."
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={16}
        />
      </div>

      {mode === "home" && (
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            className="btn-primary text-lg py-3"
            onClick={handleCpuGame}
            disabled={!isConnected || !playerName.trim()}
          >
            CPU対戦
          </button>
          <button
            className="btn-ghost text-lg py-3"
            onClick={() => setMode("create")}
            disabled={!isConnected || !playerName.trim()}
          >
            ルームを作成
          </button>
          <button
            className="btn-ghost text-lg py-3"
            onClick={() => setMode("join")}
            disabled={!isConnected || !playerName.trim()}
          >
            ルームに参加
          </button>
          {!isConnected && (
            <p className="text-center text-xs text-yellow-500 animate-pulse">サーバーに接続中...</p>
          )}
        </div>
      )}

      {mode === "create" && (
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button className="btn-primary text-lg py-3" onClick={handleCreate}>
            ルーム作成
          </button>
          <button className="btn-ghost" onClick={() => setMode("home")}>戻る</button>
        </div>
      )}

      {mode === "join" && (
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <label className="text-xs text-gray-400 uppercase tracking-widest">ルームコード</label>
          <input
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white uppercase tracking-widest text-xl text-center focus:outline-none focus:border-blue-500"
            placeholder="XXXXX"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={5}
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            className="btn-primary text-lg py-3"
            onClick={handleJoin}
            disabled={joinCode.length < 5}
          >
            参加
          </button>
          <button className="btn-ghost" onClick={() => setMode("home")}>戻る</button>
        </div>
      )}
    </div>
  );
}
