import { MechCard as MechCardType } from "@shared/types";
import MechSVG from "./MechSVG";

interface Props {
  mech: MechCardType;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export default function MechCard({ mech, selected, onClick, disabled }: Props) {
  const { baseStats } = mech;
  return (
    <div
      className={`card-base flex flex-col items-center gap-2 w-36 transition-all duration-150
        ${onClick && !disabled ? "cursor-pointer hover:border-blue-500" : ""}
        ${selected ? "border-blue-500 bg-blue-950" : ""}
        ${disabled ? "opacity-50" : ""}
      `}
      onClick={!disabled ? onClick : undefined}
    >
      <MechSVG mechId={mech.id} size={80} isHighlighted={selected} />
      <div className="text-center">
        <div className="text-xs font-bold text-white leading-tight">{mech.name}</div>
        <div className={`text-xs mt-0.5 ${mech.type === "heavy" ? "text-orange-400" : "text-cyan-400"}`}>
          {mech.type === "heavy" ? "長機" : "僚機"}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs w-full">
        <StatRow label="SP" value={baseStats.sp} />
        <StatRow label="HP" value={baseStats.hp} />
        <StatRow label="AIM" value={baseStats.aim} />
        <StatRow label="🎲" value={baseStats.dice} />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <>
      <span className="text-gray-500">{label}</span>
      <span className="text-white font-bold text-right">{value}</span>
    </>
  );
}
