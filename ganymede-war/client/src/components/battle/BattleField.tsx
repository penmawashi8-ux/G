import { useGameStore } from "../../store/gameStore";
import { useEffect, useRef } from "react";
import MechStatus from "../mech/MechStatus";
import DiceRoller from "./DiceRoller";
import InitiativeCardUI from "./InitiativeCardUI";
import GameLog from "../ui/GameLog";

export default function BattleField() {
  const { gameState, playerId, socket } = useGameStore();
  if (!gameState || gameState.phase !== "battle") return null;

  const br = gameState.battleRound!;
  const me = gameState.players.find((p) => p.id === playerId)!;
  const opponent = gameState.players.find((p) => p.id !== playerId)!;

  const isAttacker = br.attackPlayerId === playerId;
  const isDefender = br.defensePlayerId === playerId;
  const canDraw = br.subPhase === "draw";

  // Find attacker and defender mechs for display
  const attackerPlayer = gameState.players.find((p) => p.id === br.attackPlayerId);
  const attackerMech = attackerPlayer?.mechs.find((m) => m.mechCard.id === br.currentCard?.mechId);
  const attackerName = attackerMech ? `${attackerPlayer?.name}:${attackerMech.mechCard.name}` : "—";

  const defenderPlayer = gameState.players.find((p) => p.id === br.defensePlayerId);
  const defenderMech = defenderPlayer?.mechs.find((m) => m.mechCard.id === br.defenderMechId);
  const defenderName = defenderMech ? `${defenderPlayer?.name}:${defenderMech.mechCard.name}` : "—";

  function handleDrawCard() {
    socket?.emit("roll_dice");
  }

  function handleRoll() {
    socket?.emit("roll_dice");
  }

  function handleReroll(indices: number[]) {
    socket?.emit("reroll_dice", indices);
  }

  function handleConfirm() {
    socket?.emit("reroll_dice", []);
  }
  function handleResolve() {
    socket?.emit("resolve_attack");
  }

  function handleSelectDefender(mechId: string) {
    socket?.emit("select_defender", mechId);
  }

  function handleInherit(mechId: string | null) {
    socket?.emit("inherit_soul", mechId);
  }

  const myAliveMechs = me.mechs.filter((m) => !m.isDestroyed);
  const opponentAliveMechs = opponent?.mechs.filter((m) => !m.isDestroyed) ?? [];

  const canInherit = br.subPhase === "inherit" && br.inheritPlayerId === playerId;
  const inheritTargets = me.mechs.filter((m) => !m.isDestroyed && m.inheritedMechId === null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSubPhase = useRef(br.subPhase);

  useEffect(() => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    const ctx = audioContextRef.current;
    const playTone = (freq: number, duration = 0.08, type: OscillatorType = "square", volume = 0.05) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = volume;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    };
    if (lastSubPhase.current !== br.subPhase) {
      if (br.subPhase === "roll") playTone(440);
      if (br.subPhase === "selectDefender") { playTone(523); playTone(659, 0.06); }
      if (br.subPhase === "resolve") playTone(220, 0.12, "sawtooth");
      if (br.subPhase === "inherit") { playTone(784, 0.1, "triangle"); playTone(988, 0.1, "triangle"); }
      lastSubPhase.current = br.subPhase;
    }
  }, [br.subPhase]);

  return (
    <div className="p-2 sm:p-4 flex flex-col gap-3 sm:gap-4 max-w-4xl mx-auto">
      {/* Opponent mechs */}
      <div className="card-base p-2 sm:p-3">
        <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-2">
          {opponent?.name ?? "相手"} のメック
        </h3>
        <div className="flex gap-3 flex-wrap">
          {opponent?.mechs.map((mech) => (
            <MechStatus
              key={mech.mechCard.id}
              mech={mech}
              isAttacker={mech.mechCard.id === br.currentCard?.mechId && br.attackPlayerId === opponent?.id}
              isDefender={mech.mechCard.id === br.defenderMechId && br.defensePlayerId === opponent?.id}
            />
          ))}
        </div>
      </div>

      {/* Initiative area */}
      <div className="card-base">
        <InitiativeCardUI
          card={br.currentCard}
          deckCount={br.initiativeDeck.length}
          discardCount={br.initiativeDiscard.length}
          attackerName={attackerName}
          defenderName={defenderName}
          onDraw={handleDrawCard}
          canDraw={canDraw}
        />
      </div>

      {/* Defender selection */}
      {br.subPhase === "selectDefender" && isDefender && (
        <div className="card-base border-blue-700">
          <h3 className="text-sm font-bold text-blue-400 mb-2">防御するメックを選択してください</h3>
          <div className="flex gap-3 flex-wrap">
            {myAliveMechs.map((mech) => (
              <MechStatus
                key={mech.mechCard.id}
                mech={mech}
                showSelectHint
                onClick={() => handleSelectDefender(mech.mechCard.id)}
              />
            ))}
          </div>
        </div>
      )}

      {br.subPhase === "selectDefender" && !isDefender && (
        <div className="text-center text-gray-500 py-2 animate-pulse">相手が防御メックを選択中…</div>
      )}

      {/* Dice roller */}
      {(br.subPhase === "roll" || br.subPhase === "reroll" || br.subPhase === "resolve") && (
        <div className="card-base">
          {attackerMech && (
            <DiceRoller
              results={br.diceResults}
              aim={attackerMech.computedStats.aim + attackerMech.inheritBonus.aim}
              rerollsRemaining={br.maxRerolls - br.rerollsUsed}
              isAttacker={isAttacker}
              subPhase={br.subPhase}
              onRoll={handleRoll}
              onReroll={handleReroll}
              onConfirm={handleConfirm}
              onResolve={handleResolve}
            />
          )}
          {!isAttacker && (
            <p className="text-center text-gray-500 text-sm mt-2">相手が攻撃中…</p>
          )}
        </div>
      )}

      {/* Soul inheritance */}
      {canInherit && (
        <div className="card-base border-purple-700">
          <h3 className="text-sm font-bold text-purple-400 mb-2">
            魂の継承 — 破壊されたメックの魂を引き継ぐメックを選んでください
          </h3>
          <div className="flex gap-3 flex-wrap">
            {inheritTargets.map((mech) => (
              <MechStatus
                key={mech.mechCard.id}
                mech={mech}
                showSelectHint
                onClick={() => handleInherit(mech.mechCard.id)}
              />
            ))}
          </div>
          <button className="btn-ghost text-sm mt-2" onClick={() => handleInherit(null)}>
            継承しない
          </button>
        </div>
      )}

      {/* My mechs */}
      <div className="card-base p-2 sm:p-3">
        <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-2">
          {me.name} のメック
        </h3>
        <div className="flex gap-3 flex-wrap">
          {me.mechs.map((mech) => (
            <MechStatus
              key={mech.mechCard.id}
              mech={mech}
              isAttacker={mech.mechCard.id === br.currentCard?.mechId && br.attackPlayerId === playerId}
              isDefender={mech.mechCard.id === br.defenderMechId && br.defensePlayerId === playerId}
            />
          ))}
        </div>
      </div>

      {/* Game log */}
      <div className="hidden sm:block">
        <GameLog />
      </div>
    </div>
  );
}
