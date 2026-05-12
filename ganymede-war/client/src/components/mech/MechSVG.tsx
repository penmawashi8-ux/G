import { PartCard } from "@shared/types";

interface MechSVGProps {
  mechId: string;
  rightPart?: PartCard;
  leftPart?: PartCard;
  backpackPart?: PartCard;
  isDestroyed?: boolean;
  isHighlighted?: boolean;
  size?: number;
}

// Color palette derived from mech id
function mechColor(mechId: string): { body: string; accent: string } {
  if (mechId.includes("red")) return { body: "#7f1d1d", accent: "#ef4444" };
  if (mechId.includes("green")) return { body: "#14532d", accent: "#22c55e" };
  if (mechId.includes("purple")) return { body: "#3b0764", accent: "#a855f7" };
  if (mechId.includes("gray") || mechId.includes("grey")) return { body: "#374151", accent: "#9ca3af" };
  if (mechId.includes("dark")) return { body: "#1c1917", accent: "#f97316" };
  if (mechId.includes("blue")) return { body: "#1e3a5f", accent: "#3b82f6" };
  return { body: "#1e293b", accent: "#60a5fa" };
}

function BackpackSVG({ color, hasPart }: { color: string; hasPart: boolean }) {
  if (!hasPart) return null;
  return (
    <g>
      <rect x="35" y="5" width="30" height="22" rx="3" fill={color} opacity="0.9" />
      <rect x="40" y="8" width="8" height="5" rx="1" fill="#000" opacity="0.4" />
      <rect x="52" y="8" width="8" height="5" rx="1" fill="#000" opacity="0.4" />
    </g>
  );
}

function RightArmSVG({ color, hasPart }: { color: string; hasPart: boolean }) {
  if (!hasPart) {
    return <rect x="72" y="28" width="8" height="25" rx="3" fill={color} opacity="0.5" />;
  }
  return (
    <g>
      <rect x="72" y="28" width="8" height="28" rx="3" fill={color} />
      <rect x="72" y="50" width="14" height="10" rx="2" fill={color} opacity="0.85" />
    </g>
  );
}

function LeftArmSVG({ color, hasPart }: { color: string; hasPart: boolean }) {
  if (!hasPart) {
    return <rect x="20" y="28" width="8" height="25" rx="3" fill={color} opacity="0.5" />;
  }
  return (
    <g>
      <rect x="18" y="28" width="8" height="28" rx="3" fill={color} />
      <rect x="10" y="28" width="10" height="18" rx="2" fill={color} opacity="0.85" />
    </g>
  );
}

export default function MechSVG({
  mechId,
  rightPart,
  leftPart,
  backpackPart,
  isDestroyed = false,
  isHighlighted = false,
  size = 100,
}: MechSVGProps) {
  const { body, accent } = mechColor(mechId);
  const isHeavy = mechId.startsWith("leader");

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ filter: isDestroyed ? "grayscale(100%) opacity(0.4)" : isHighlighted ? `drop-shadow(0 0 6px ${accent})` : undefined }}
    >
      {/* Backpack */}
      <BackpackSVG color={accent} hasPart={!!backpackPart} />

      {/* Body */}
      <rect x="30" y="24" width="40" height={isHeavy ? 36 : 30} rx="4" fill={body} />
      <rect x="35" y="28" width="30" height={isHeavy ? 20 : 16} rx="2" fill={accent} opacity="0.25" />

      {/* Head */}
      <rect x="36" y={isHeavy ? 13 : 16} width="28" height={isHeavy ? 13 : 11} rx="3" fill={body} />
      <rect x="40" y={isHeavy ? 16 : 18} width="20" height="5" rx="1" fill={accent} opacity="0.6" />

      {/* Eyes */}
      <circle cx="44" cy={isHeavy ? 20 : 22} r="2" fill={accent} />
      <circle cx="56" cy={isHeavy ? 20 : 22} r="2" fill={accent} />

      {/* Legs */}
      <rect x="34" y={isHeavy ? 58 : 52} width="12" height={isHeavy ? 22 : 18} rx="3" fill={body} />
      <rect x="54" y={isHeavy ? 58 : 52} width="12" height={isHeavy ? 22 : 18} rx="3" fill={body} />
      <rect x="32" y={isHeavy ? 77 : 67} width="14" height="6" rx="2" fill={accent} opacity="0.7" />
      <rect x="54" y={isHeavy ? 77 : 67} width="14" height="6" rx="2" fill={accent} opacity="0.7" />

      {/* Arms */}
      <RightArmSVG color={accent} hasPart={!!rightPart} />
      <LeftArmSVG color={accent} hasPart={!!leftPart} />

      {/* Destroyed X */}
      {isDestroyed && (
        <g stroke="#ef4444" strokeWidth="4" opacity="0.8">
          <line x1="20" y1="20" x2="80" y2="80" />
          <line x1="80" y1="20" x2="20" y2="80" />
        </g>
      )}
    </svg>
  );
}
