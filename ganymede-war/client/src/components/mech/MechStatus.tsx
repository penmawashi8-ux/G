import { AssembledMech } from "@shared/types";
import MechSVG from "./MechSVG";

interface Props {
  mech: AssembledMech;
  isAttacker?: boolean;
  isDefender?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  showSelectHint?: boolean;
}

export default function MechStatus({ mech, isAttacker, isDefender, onClick, disabled, showSelectHint }: Props) {
  const { computedStats, currentHP, damageCounters, isDestroyed, inheritedMechId, inheritBonus } = mech;
  const maxHP = computedStats.hp + inheritBonus.hp;
  const hpPercent = Math.max(0, (currentHP / maxHP) * 100);

  const hpColor =
    hpPercent > 60 ? "bg-green-500" :
    hpPercent > 30 ? "bg-yellow-500" :
    "bg-red-500";

  const borderClass = isAttacker
    ? "border-orange-500 shadow-lg shadow-orange-900"
    : isDefender
    ? "border-blue-500 shadow-lg shadow-blue-900"
    : showSelectHint && !isDestroyed && !disabled
    ? "border-gray-500 hover:border-blue-400 cursor-pointer"
    : "";

  return (
    <div
      className={`card-base flex flex-col gap-1.5 sm:gap-2 w-[47%] min-w-[150px] sm:w-44 transition-all ${borderClass} ${isDestroyed ? "opacity-40" : ""}`}
      onClick={!disabled && onClick ? onClick : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white leading-tight truncate">{mech.mechCard.name}</span>
        <span className={`text-xs px-1 rounded ${mech.mechCard.type === "heavy" ? "bg-orange-900 text-orange-300" : "bg-cyan-900 text-cyan-300"}`}>
          {mech.mechCard.type === "heavy" ? "長" : "僚"}
        </span>
      </div>

      <MechSVG
        mechId={mech.mechCard.id}
        rightPart={mech.parts.right}
        leftPart={mech.parts.left}
        backpackPart={mech.parts.backpack}
        isDestroyed={isDestroyed}
        isHighlighted={isAttacker || isDefender}
        size={68}
      />

      {/* HP bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-400 mb-0.5">
          <span>HP</span>
          <span className="text-white">{currentHP}/{maxHP}</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
          <div
            className={`h-full rounded transition-all duration-300 ${hpColor}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 text-xs gap-1">
        {[
          { label: "SP", value: computedStats.sp },
          { label: "AIM", value: computedStats.aim + inheritBonus.aim },
          { label: "🎲", value: computedStats.dice },
          { label: "↩", value: computedStats.reroll },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center bg-gray-800 rounded py-0.5">
            <span className="text-gray-500" style={{ fontSize: 9 }}>{label}</span>
            <span className="text-white font-bold">{value}</span>
          </div>
        ))}
      </div>

      {/* Damage counters */}
      {damageCounters > 0 && (
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: damageCounters }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-red-600" />
          ))}
        </div>
      )}

      {/* Inheritance badge */}
      {inheritedMechId && (
        <div className="text-xs text-purple-400 text-center">
          魂の継承 +HP{inheritBonus.hp} +AIM{inheritBonus.aim}
        </div>
      )}

      {/* Parts equipped */}
      <div className="flex gap-1 flex-wrap">
        {mech.parts.right && <PartBadge name={mech.parts.right.name} slot="R" />}
        {mech.parts.left && <PartBadge name={mech.parts.left.name} slot="L" />}
        {mech.parts.backpack && <PartBadge name={mech.parts.backpack.name} slot="B" />}
      </div>

      {isAttacker && <div className="text-center text-xs text-orange-400 font-bold animate-pulse">ATTACK</div>}
      {isDefender && <div className="text-center text-xs text-blue-400 font-bold animate-pulse">DEFEND</div>}
      {showSelectHint && !isDestroyed && !disabled && (
        <div className="text-center text-xs text-gray-400">クリックして防御</div>
      )}
    </div>
  );
}

function PartBadge({ name, slot }: { name: string; slot: string }) {
  return (
    <span className="text-xs bg-gray-800 text-gray-400 px-1 rounded leading-tight" title={name}>
      {slot}:{name.split(" ")[0].slice(0, 6)}
    </span>
  );
}
