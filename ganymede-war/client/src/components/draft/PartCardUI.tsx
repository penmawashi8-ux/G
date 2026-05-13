import { PartCard } from "@shared/types";

interface Props {
  part: PartCard;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  dim?: boolean;
}

const slotColors: Record<string, string> = {
  left: "text-cyan-400",
  right: "text-orange-400",
  backpack: "text-purple-400",
};
const slotLabels: Record<string, string> = {
  left: "左手",
  right: "右手",
  backpack: "背中",
};

function mod(v: number) {
  if (v === 0) return <span className="text-gray-500">±0</span>;
  return <span className={v > 0 ? "text-green-400" : "text-red-400"}>{v > 0 ? "+" : ""}{v}</span>;
}

export default function PartCardUI({ part, onClick, disabled, selected, dim }: Props) {
  return (
    <div
      className={`card-base flex flex-col gap-1 w-24 transition-all
        ${onClick && !disabled ? "cursor-pointer hover:border-blue-500" : ""}
        ${selected ? "border-blue-500 bg-blue-950" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${dim ? "opacity-30" : ""}
      `}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${slotColors[part.slot]}`}>{slotLabels[part.slot]}</span>
      </div>
      <div className="text-xs font-bold text-white leading-tight">{part.name}</div>
      <div className="grid grid-cols-2 gap-x-1 text-xs">
        <span className="text-gray-500">SP</span><span>{mod(part.spMod)}</span>
        <span className="text-gray-500">HP</span><span>{mod(part.hpMod)}</span>
        <span className="text-gray-500">AIM</span><span>{mod(part.aimMod)}</span>
        {part.bonusDice !== 0 && <><span className="text-gray-500">🎲</span><span className="text-green-400">+{part.bonusDice}</span></>}
        {part.bonusReroll !== 0 && <><span className="text-gray-500">↩</span><span className="text-green-400">+{part.bonusReroll}</span></>}
      </div>
    </div>
  );
}
