import React from 'react';
import { BaseHorse, HorseState, EffectiveStats } from '../types';
import { getEffectiveStats } from '../utils';

interface BaseCardProps {
  horse: BaseHorse;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export function BaseHorseCard({ horse, selected, onClick, disabled, compact }: BaseCardProps) {
  const typeLabel = horse.type === 'honmei' ? '本命' : '対抗';
  const typeBg = horse.type === 'honmei' ? 'bg-yellow-100 text-yellow-800' : 'bg-sky-100 text-sky-800';

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        rounded-xl border-2 bg-white transition-all
        ${compact ? 'p-3' : 'p-4'}
        ${onClick && !disabled ? 'cursor-pointer hover:shadow-lg hover:scale-102' : ''}
        ${selected ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-300 scale-105' : 'border-gray-200'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className={`font-bold ${compact ? 'text-sm' : 'text-base'}`}>{horse.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBg}`}>{typeLabel}</span>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <StatBox label="脚力" value={horse.ability} icon="⚡" />
        <StatBox label="スピード" value={horse.speed} icon="💨" />
        <StatBox label="やる気" value={horse.motivation} icon="🔥" />
        <StatBox label="根性" value={horse.grit} icon="❤️" />
      </div>
    </div>
  );
}

interface StateCardProps {
  horse: HorseState;
  playerColor: string;
  horseLabel?: string;
  compact?: boolean;
  showDamage?: boolean;
}

export function HorseStateCard({ horse, playerColor, horseLabel, compact, showDamage }: StateCardProps) {
  const stats: EffectiveStats = getEffectiveStats(horse);
  const damagePercent = stats.grit > 0 ? Math.min(100, (horse.damage / stats.grit) * 100) : 100;

  return (
    <div className={`
      rounded-xl border-2 bg-white transition-all relative
      ${compact ? 'p-3' : 'p-4'}
      ${horse.fallen ? 'opacity-40 border-gray-300' : `border-gray-200`}
    `}>
      {horse.fallen && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 rounded-xl z-10">
          <span className="text-2xl font-bold text-gray-500">脱落</span>
        </div>
      )}
      <div className="flex items-start justify-between mb-2">
        <div>
          {horseLabel && <p className="text-xs text-gray-400">{horseLabel}</p>}
          <h3 className={`font-bold ${compact ? 'text-sm' : 'text-base'}`}>{horse.base.name}</h3>
        </div>
        <div className="flex gap-1">
          {horse.soulInherited && <span title="気合の継承" className="text-xs bg-orange-100 text-orange-600 px-1 rounded">魂</span>}
          {horse.bondInherited && <span title="絆の継承" className="text-xs bg-pink-100 text-pink-600 px-1 rounded">絆</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 text-xs mb-2">
        <StatBoxEff label="脚力" base={horse.base.ability} eff={stats.ability} icon="⚡" />
        <StatBoxEff label="スピード" base={horse.base.speed} eff={stats.speed} icon="💨" />
        <StatBoxEff label="やる気" base={horse.base.motivation} eff={stats.motivation} icon="🔥" />
        <StatBoxEff label="根性" base={horse.base.grit} eff={stats.grit} icon="❤️" />
      </div>

      {showDamage && !horse.fallen && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>ダメージ</span>
            <span className="font-medium">{horse.damage} / {stats.grit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${damagePercent >= 75 ? 'bg-red-500' : damagePercent >= 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
              style={{ width: `${damagePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Equipment slots */}
      {!compact && (
        <div className="mt-2 flex gap-1">
          <SlotBadge label="J" part={horse.jockey} />
          <SlotBadge label="B" part={horse.blinker} />
          <SlotBadge label="C" part={horse.cheek} />
          {stats.extraDice > 0 && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">🎲+{stats.extraDice}</span>}
          {stats.extraReroll > 0 && <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">↺+{stats.extraReroll}</span>}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
      <span>{icon}</span>
      <span className="text-gray-500">{label}</span>
      <span className="font-bold ml-auto">{value}</span>
    </div>
  );
}

function StatBoxEff({ label, base, eff, icon }: { label: string; base: number; eff: number; icon: string }) {
  const changed = eff !== base;
  return (
    <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
      <span>{icon}</span>
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`font-bold ml-auto ${changed ? (eff > base ? 'text-emerald-600' : 'text-red-500') : ''}`}>{eff}</span>
    </div>
  );
}

function SlotBadge({ label, part }: { label: string; part?: { name: string } | undefined }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border ${part ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-300'}`}>
      {part ? `${label}:${part.name.slice(0, 3)}` : `${label}:--`}
    </span>
  );
}
