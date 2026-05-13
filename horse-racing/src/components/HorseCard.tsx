import React from 'react';
import { BaseHorse, HorseState, EffectiveStats, Part } from '../types';
import { getEffectiveStats } from '../utils';

// ── Base horse card (for draft screens) ─────────────────────────────────────

interface BaseCardProps {
  horse: BaseHorse;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function BaseHorseCard({ horse, selected, onClick, disabled }: BaseCardProps) {
  const isHonmei = horse.type === 'honmei';
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        rounded-2xl border-2 bg-white transition-all select-none
        ${onClick && !disabled ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : ''}
        ${selected ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-200' : 'border-gray-200'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
    >
      {/* Header */}
      <div className={`px-4 py-2 rounded-t-2xl flex justify-between items-center ${isHonmei ? 'bg-amber-50' : 'bg-sky-50'}`}>
        <span className="font-bold text-gray-800">{horse.name}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isHonmei ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
          {isHonmei ? '本命' : '対抗'}
        </span>
      </div>
      {/* Stats */}
      <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
        <StatLine label="脚力" value={horse.ability} />
        <StatLine label="スピード" value={horse.speed} />
        <StatLine label="やる気" value={horse.motivation} />
        <StatLine label="根性" value={horse.grit} />
      </div>
    </div>
  );
}

// ── Equipped horse card (for race/equip screens) ─────────────────────────────

interface StateCardProps {
  horse: HorseState;
  playerColor: string;
  compact?: boolean;
  showDamage?: boolean;
}

export function HorseStateCard({ horse, playerColor, compact, showDamage }: StateCardProps) {
  const stats = getEffectiveStats(horse);
  const damagePercent = stats.grit > 0 ? Math.min(100, (horse.damage / stats.grit) * 100) : 100;

  return (
    <div className={`rounded-xl border-2 bg-white relative ${horse.fallen ? 'opacity-40 border-gray-200' : 'border-gray-200'}`}>
      {horse.fallen && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10">
          <span className="font-bold text-gray-400 text-sm">脱落</span>
        </div>
      )}
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center">
        <span className={`font-bold text-sm ${compact ? 'text-xs' : ''}`}>{horse.base.name}</span>
        <div className="flex gap-1">
          {horse.soulInherited && <span className="text-[10px] bg-orange-100 text-orange-600 px-1 rounded font-medium">魂</span>}
          {horse.bondInherited && <span className="text-[10px] bg-pink-100 text-pink-600 px-1 rounded font-medium">絆</span>}
        </div>
      </div>
      {/* Stats */}
      <div className="px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1">
        <StatLineEff label="脚力" base={horse.base.ability} eff={stats.ability} />
        <StatLineEff label="スピード" base={horse.base.speed} eff={stats.speed} />
        <StatLineEff label="やる気" base={horse.base.motivation} eff={stats.motivation} />
        <StatLineEff label="根性" base={horse.base.grit} eff={stats.grit} />
      </div>
      {/* Damage bar */}
      {showDamage && !horse.fallen && (
        <div className="px-3 pb-2">
          <div className="flex justify-between text-xs text-gray-400 mb-0.5">
            <span>ダメージ</span>
            <span>{horse.damage}/{stats.grit}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${damagePercent >= 75 ? 'bg-red-400' : damagePercent >= 50 ? 'bg-yellow-400' : 'bg-emerald-400'}`}
              style={{ width: `${damagePercent}%` }}
            />
          </div>
        </div>
      )}
      {/* Equipment */}
      {!compact && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {horse.jockey && <SlotTag label="J" name={horse.jockey.name} />}
          {horse.blinker && <SlotTag label="B" name={horse.blinker.name} />}
          {horse.cheek && <SlotTag label="C" name={horse.cheek.name} />}
          {stats.extraDice > 0 && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-200">サイコロ+{stats.extraDice}</span>}
          {stats.extraReroll > 0 && <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-200">リロール+{stats.extraReroll}</span>}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-bold text-gray-800 tabular-nums">{value}</span>
    </div>
  );
}

function StatLineEff({ label, base, eff }: { label: string; base: number; eff: number }) {
  const diff = eff - base;
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-bold tabular-nums ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-800'}`}>
        {eff}{diff !== 0 && <span className="text-[10px] ml-0.5">({diff > 0 ? '+' : ''}{diff})</span>}
      </span>
    </div>
  );
}

function SlotTag({ label, name }: { label: string; name: string }) {
  return (
    <span className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
      {label}:{name}
    </span>
  );
}
