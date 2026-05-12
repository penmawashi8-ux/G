import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartCard, AssemblyConfirmPayload, Direction } from "@shared/types";
import { useGameStore } from "../../store/gameStore";
import PartCardUI from "../draft/PartCardUI";
import MechSVG from "./MechSVG";
import Timer from "../ui/Timer";

interface SlotAssignment {
  right?: string;
  left?: string;
  backpack?: string;
}

function computePreviewStats(
  base: { sp: number; hp: number; aim: number; dice: number; reroll: number },
  parts: { right?: PartCard; left?: PartCard; backpack?: PartCard }
) {
  let sp = base.sp, hp = base.hp, aim = base.aim, dice = base.dice, reroll = base.reroll;
  for (const p of [parts.right, parts.left, parts.backpack]) {
    if (!p) continue;
    sp += p.spMod; hp += p.hpMod; aim += p.aimMod;
    dice += p.bonusDice; reroll += p.bonusReroll;
  }
  return { sp, hp, aim, dice, reroll };
}

function isValid(stats: { sp: number; hp: number; aim: number }) {
  return stats.sp > 0 && stats.hp > 0 && stats.aim > 0;
}

interface MechSlotEditorProps {
  label: string;
  mechCard: { id: string; name: string; type: string; baseStats: { sp: number; hp: number; aim: number; dice: number; reroll: number } };
  assignment: SlotAssignment;
  hand: PartCard[];
  usedPartIds: Set<string>;
  onAssign: (slot: "right" | "left" | "backpack", partId: string | undefined) => void;
  directionChoice: Direction;
  onDirectionChange: (d: Direction) => void;
}

function MechSlotEditor({ label, mechCard, assignment, hand, usedPartIds, onAssign, directionChoice, onDirectionChange }: MechSlotEditorProps) {
  const rightPart = hand.find((p) => p.id === assignment.right);
  const leftPart = hand.find((p) => p.id === assignment.left);
  const backpackPart = hand.find((p) => p.id === assignment.backpack);
  const stats = computePreviewStats(mechCard.baseStats, { right: rightPart, left: leftPart, backpack: backpackPart });
  const valid = isValid(stats);
  const isOddSP = stats.sp % 2 !== 0;

  const slotParts: Record<string, PartCard[]> = {
    right: hand.filter((p) => p.slot === "right"),
    left: hand.filter((p) => p.slot === "left"),
    backpack: hand.filter((p) => p.slot === "backpack"),
  };

  return (
    <div className={`card-base flex flex-col gap-3 ${valid ? "" : "border-red-700"}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-white">{label}: {mechCard.name}</span>
        <span className={`text-xs ${valid ? "text-green-400" : "text-red-400"}`}>
          {valid ? "有効" : "HP/AIM/SPが0以下"}
        </span>
      </div>

      {/* Mech preview */}
      <div className="flex gap-4 items-start">
        <motion.div layoutId={`mech-${mechCard.id}`}>
          <MechSVG
            mechId={mechCard.id}
            rightPart={rightPart}
            leftPart={leftPart}
            backpackPart={backpackPart}
            size={90}
          />
        </motion.div>
        {/* Stats preview */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          {[
            { label: "SP", value: stats.sp },
            { label: "HP", value: stats.hp },
            { label: "AIM", value: stats.aim },
            { label: "🎲", value: stats.dice },
            { label: "↩", value: stats.reroll },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-1">
              <span className="text-gray-500">{label}</span>
              <span className={`font-bold ${value <= 0 ? "text-red-400" : "text-white"}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Slot selectors */}
      {(["right", "left", "backpack"] as const).map((slot) => {
        const slotLabel = slot === "right" ? "右手" : slot === "left" ? "左手" : "背中";
        const assignedId = assignment[slot];
        const availableParts = slotParts[slot];
        return (
          <div key={slot}>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{slotLabel}</div>
            <div className="flex flex-wrap gap-1">
              <button
                className={`text-xs px-2 py-1 rounded border ${!assignedId ? "border-blue-500 bg-blue-950" : "border-gray-700"}`}
                onClick={() => onAssign(slot, undefined)}
              >
                なし
              </button>
              {availableParts.map((p) => {
                const isAssigned = assignedId === p.id;
                const isUsedElsewhere = usedPartIds.has(p.id) && !isAssigned;
                return (
                  <button
                    key={p.id}
                    className={`text-xs px-2 py-1 rounded border transition-colors
                      ${isAssigned ? "border-blue-500 bg-blue-950 text-white" : "border-gray-700 text-gray-300"}
                      ${isUsedElsewhere ? "opacity-30 cursor-not-allowed" : "hover:border-blue-400"}
                    `}
                    onClick={() => !isUsedElsewhere && onAssign(slot, p.id)}
                    disabled={isUsedElsewhere}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Direction choice for odd SP */}
      {isOddSP && (
        <div>
          <div className="text-xs text-yellow-400 mb-1">SP奇数 — イニシアチブ方向を選択:</div>
          <div className="flex gap-2">
            <button
              className={`btn text-xs px-3 py-1 ${directionChoice === "right" ? "bg-blue-700" : "btn-ghost"}`}
              onClick={() => onDirectionChange("right")}
            >
              右多め ({Math.ceil(stats.sp / 2)}右/{Math.floor(stats.sp / 2)}左)
            </button>
            <button
              className={`btn text-xs px-3 py-1 ${directionChoice === "left" ? "bg-blue-700" : "btn-ghost"}`}
              onClick={() => onDirectionChange("left")}
            >
              左多め ({Math.floor(stats.sp / 2)}右/{Math.ceil(stats.sp / 2)}左)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MechAssembly() {
  const { gameState, playerId, socket } = useGameStore();
  const [leaderAssign, setLeaderAssign] = useState<SlotAssignment>({});
  const [supportAssign, setSupportAssign] = useState<SlotAssignment>({});
  const [leaderDir, setLeaderDir] = useState<Direction>("right");
  const [supportDir, setSupportDir] = useState<Direction>("right");
  const [confirmed, setConfirmed] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  if (!gameState || gameState.phase !== "assembly") return null;

  const me = gameState.players.find((p) => p.id === playerId);
  if (!me || me.selectedMechs.length < 2) return null;

  const [leaderCard, supportCard] = me.selectedMechs;
  const deadline = gameState.assemblyData?.deadline ?? Date.now() + 60_000;
  const myConfirmed = playerId != null && (gameState.assemblyData?.confirmed.includes(playerId) ?? false);
  const opponentConfirmed = gameState.players
    .filter((p) => p.id !== playerId)
    .every((p) => gameState.assemblyData?.confirmed.includes(p.id));

  const usedPartIds = new Set<string>([
    leaderAssign.right, leaderAssign.left, leaderAssign.backpack,
    supportAssign.right, supportAssign.left, supportAssign.backpack,
  ].filter(Boolean) as string[]);

  const hand = me.hand;

  function getPreviewStats(card: typeof leaderCard, assign: SlotAssignment) {
    const right = hand.find((p) => p.id === assign.right);
    const left = hand.find((p) => p.id === assign.left);
    const backpack = hand.find((p) => p.id === assign.backpack);
    return computePreviewStats(card.baseStats, { right, left, backpack });
  }

  const leaderValid = isValid(getPreviewStats(leaderCard, leaderAssign));
  const supportValid = isValid(getPreviewStats(supportCard, supportAssign));
  const canConfirm = leaderValid && supportValid && !confirmed && !myConfirmed;

  function handleConfirm() {
    if (!canConfirm) return;
    setShowAnimation(true);
    setTimeout(() => {
      const payload: AssemblyConfirmPayload = {
        leader: leaderAssign,
        support: supportAssign,
        directionChoices: {
          [leaderCard.id]: leaderDir,
          [supportCard.id]: supportDir,
        },
      };
      socket?.emit("assembly_confirm", payload);
      setConfirmed(true);
      setShowAnimation(false);
    }, 1200);
  }

  return (
    <div className="p-4 flex flex-col gap-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-blue-400">パーツ配備</h2>
        <div className="flex items-center gap-4">
          {!myConfirmed && <Timer deadline={deadline} />}
          {myConfirmed && !opponentConfirmed && (
            <span className="text-yellow-400 animate-pulse text-sm">相手を待っています…</span>
          )}
          {myConfirmed && opponentConfirmed && (
            <span className="text-green-400 text-sm">両者確定済み</span>
          )}
        </div>
      </div>

      {/* Hand */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-2">手札</h3>
        <div className="flex flex-wrap gap-2">
          {hand.map((part) => (
            <PartCardUI key={part.id} part={part} dim={usedPartIds.has(part.id)} />
          ))}
        </div>
      </div>

      {/* Mech editors */}
      <AnimatePresence>
        {showAnimation ? (
          <motion.div
            key="animation"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center gap-8 py-8"
          >
            {[leaderCard, supportCard].map((card) => (
              <motion.div
                key={card.id}
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center gap-2"
              >
                <MechSVG mechId={card.id} size={120} isHighlighted />
                <span className="text-white font-bold">{card.name}</span>
                <span className="text-green-400 text-sm">配備完了!</span>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="editors" className="flex flex-col gap-4">
            {!myConfirmed ? (
              <>
                <MechSlotEditor
                  label="長機"
                  mechCard={leaderCard}
                  assignment={leaderAssign}
                  hand={hand}
                  usedPartIds={usedPartIds}
                  onAssign={(slot, partId) => setLeaderAssign((prev) => ({ ...prev, [slot]: partId }))}
                  directionChoice={leaderDir}
                  onDirectionChange={setLeaderDir}
                />
                <MechSlotEditor
                  label="僚機"
                  mechCard={supportCard}
                  assignment={supportAssign}
                  hand={hand}
                  usedPartIds={usedPartIds}
                  onAssign={(slot, partId) => setSupportAssign((prev) => ({ ...prev, [slot]: partId }))}
                  directionChoice={supportDir}
                  onDirectionChange={setSupportDir}
                />
                <button
                  className="btn-success text-lg py-3 w-full"
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                >
                  決定
                </button>
              </>
            ) : (
              <div className="text-center text-green-400 text-lg font-bold py-8">
                配備確定済み — 相手を待っています
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
