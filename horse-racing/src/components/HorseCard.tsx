import React from 'react';
import { BaseHorse, HorseState } from '../types';
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
      <div className="px-4 py-3 space-y-2">
        <StatLine label="スピード" value={horse.speed} description="この値以上の目が出たら成功 → speed分前進" />
        <StatLine label="体力" value={horse.hp} description="HP（これ以上ダメージを受けると脱落）" />
      </div>
      {/* Mechanic hint */}
      <div className="px-4 pb-3">
        <div className="bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-500 text-center">
          成功確率 <span className="font-bold text-gray-700">{Math.round(Math.max(0, 7 - horse.speed) / 6 * 100)}%</span>
          <span className="mx-1.5 text-gray-300">|</span>
          前進期待値 <span className="font-bold text-gray-700">{expectedAdvance(horse.speed).toFixed(1)}</span> マス/回
        </div>
      </div>
    </div>
  );
}

function expectedAdvance(speed: number): number {
  // E[advance] = P(die >= speed) * speed = (7 - speed) / 6 * speed
  return Math.max(0, (7 - speed) / 6) * speed;
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
  const hpRemaining = Math.max(0, stats.hp - horse.damage);
  const hpPercent = stats.hp > 0 ? (hpRemaining / stats.hp) * 100 : 0;

  return (
    <div className={`rounded-xl border-2 bg-white relative ${horse.fallen ? 'opacity-40 border-gray-200' : 'border-gray-200'}`}>
      {horse.fallen && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10">
          <span className="font-bold text-gray-400 text-sm">脱落</span>
        </div>
      )}
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center">
        <span className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`}>{horse.base.name}</span>
        <div className="flex gap-1">
          {horse.soulInherited && <span className="text-[10px] bg-orange-100 text-orange-600 px-1 rounded font-medium">魂</span>}
          {horse.bondInherited && <span className="text-[10px] bg-pink-100 text-pink-600 px-1 rounded font-medium">絆</span>}
        </div>
      </div>
      {/* Stats */}
      <div className="px-3 py-2 space-y-1">
        <StatLineEff label="スピード" base={horse.base.speed} eff={stats.speed} description={compact ? undefined : "行動成功の閾値"} />
        <StatLineEff label="体力" base={horse.base.hp} eff={stats.hp} description={compact ? undefined : "HP"} />
      </div>
      {/* HP bar */}
      {showDamage && !horse.fallen && (
        <div className="px-3 pb-2">
          <div className="flex justify-between text-xs text-gray-400 mb-0.5">
            <span>体力</span>
            <span>{hpRemaining} / {stats.hp}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${hpPercent <= 33 ? 'bg-red-400' : hpPercent <= 66 ? 'bg-yellow-400' : 'bg-emerald-400'}`}
              style={{ width: `${hpPercent}%` }}
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
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatLine({ label, value, description }: { label: string; value: number; description?: string }) {
  return (
    <div className="flex justify-between items-start">
      <div className="flex flex-col">
        <span className="text-sm text-gray-600 font-medium">{label}</span>
        {description && <span className="text-[10px] text-gray-400 leading-tight">{description}</span>}
      </div>
      <span className="text-sm font-bold text-gray-800 tabular-nums mt-0.5">{value}</span>
    </div>
  );
}

function StatLineEff({ label, base, eff, description }: { label: string; base: number; eff: number; description?: string }) {
  const diff = eff - base;
  return (
    <div className="flex justify-between items-start">
      <div className="flex flex-col">
        <span className="text-xs text-gray-600">{label}</span>
        {description && <span className="text-[10px] text-gray-400 leading-tight">{description}</span>}
      </div>
      <span className={`text-xs font-bold tabular-nums mt-0.5 ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-800'}`}>
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
