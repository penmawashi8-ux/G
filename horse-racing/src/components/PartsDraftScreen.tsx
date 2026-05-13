import React, { useState } from 'react';
import { GameState, Part, HorseState } from '../types';
import { GameAction } from '../gameReducer';
import { COLOR_CLASS, COLOR_LABEL } from '../data';
import { getSlotLabel, getEffectiveStats } from '../utils';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  myTurn?: boolean;
}

const SLOT_COLOR: Record<string, string> = {
  jockey: 'bg-amber-50 border-amber-200 text-amber-800',
  blinker: 'bg-sky-50 border-sky-200 text-sky-800',
  cheek: 'bg-purple-50 border-purple-200 text-purple-800',
};

// ── Per-stat row in simulation panel ─────────────────────────────────────────

function StatSimRow({ label, desc, before, after }: { label: string; desc: string; before: number; after: number }) {
  const diff = after - before;
  const changed = diff !== 0;
  return (
    <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${
      changed ? (diff > 0 ? 'bg-emerald-100' : 'bg-red-100') : 'bg-white/60'
    }`}>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-[10px] text-gray-400 leading-tight">{desc}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400 tabular-nums">{before}</span>
        {changed ? (
          <>
            <span className="text-gray-300 text-xs">→</span>
            <span className={`text-sm font-bold tabular-nums ${diff > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {after}
              <span className="text-[11px] font-normal ml-0.5">({diff > 0 ? '+' : ''}{diff})</span>
            </span>
          </>
        ) : (
          <span className="text-xs font-bold text-gray-600 tabular-nums">{after}</span>
        )}
      </div>
    </div>
  );
}

// ── Simulation card for one horse ─────────────────────────────────────────────

function HorseSimCard({ horse, part }: { horse: HorseState; part: Part }) {
  const before = getEffectiveStats(horse);
  const testHorse = { ...horse, [part.slot]: part };
  const after = getEffectiveStats(testHorse);
  const isInvalid = after.speed < 1 || after.hp < 1;

  return (
    <div className={`rounded-xl border-2 p-3 ${isInvalid ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-bold text-gray-800 text-sm">🏇 {horse.base.name}</p>
        {isInvalid && <span className="text-xs text-red-600 font-semibold bg-red-100 px-2 py-0.5 rounded-full">⚠️ 装備不可</span>}
      </div>
      <div className="space-y-1">
        <StatSimRow label="スピード" desc="この値より大きい出目で成功" before={before.speed} after={after.speed} />
        <StatSimRow label="体力" desc="HP（これ以上ダメージで脱落）" before={before.hp} after={after.hp} />
      </div>
    </div>
  );
}

// ── Bottom sheet simulation panel ─────────────────────────────────────────────

function SimulationPanel({ part, horses, myTurn, onConfirm, onClose }: {
  part: Part;
  horses: HorseState[];
  myTurn: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const modEntries = [
    part.speedMod !== 0 && { label: `スピード${part.speedMod > 0 ? '+' : ''}${part.speedMod}`, positive: part.speedMod < 0 },
    part.hpMod !== 0 && { label: `体力${part.hpMod > 0 ? '+' : ''}${part.hpMod}`, positive: part.hpMod > 0 },
  ].filter(Boolean) as { label: string; positive: boolean }[];

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-h-[88vh] flex flex-col bg-white rounded-t-2xl shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-xl leading-tight">{part.name}</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded border font-medium ${SLOT_COLOR[part.slot]}`}>
                {getSlotLabel(part.slot)}
              </span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none mt-[-4px]">×</button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {modEntries.map((m, i) => (
              <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m.positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {m.label}
              </span>
            ))}
            {modEntries.length === 0 && <span className="text-xs text-gray-400">ステータス補正なし</span>}
          </div>
        </div>

        {/* Simulation cards */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <p className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wide">装備時ステータスシミュレーション</p>
          <div className="space-y-3">
            {horses.map((h, i) => (
              <HorseSimCard key={i} horse={h} part={part} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            ※ 実際の装備はドラフト終了後の装備フェーズで行います
          </p>
        </div>

        {/* Action buttons */}
        <div className="px-4 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
          >
            閉じる
          </button>
          {myTurn && (
            <button
              onClick={onConfirm}
              className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl transition-all shadow-md"
            >
              このパーツを選ぶ ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Part card (grid) ──────────────────────────────────────────────────────────

function PartCard({ part, onClick, previewing }: { part: Part; onClick: () => void; previewing?: boolean }) {
  const mods = [
    part.speedMod !== 0 && { label: `スピード${part.speedMod > 0 ? '+' : ''}${part.speedMod}`, good: part.speedMod < 0 },
    part.hpMod !== 0 && { label: `体力${part.hpMod > 0 ? '+' : ''}${part.hpMod}`, good: part.hpMod > 0 },
  ].filter(Boolean) as { label: string; good: boolean }[];

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl border-2 p-3 transition-all cursor-pointer select-none
        ${previewing
          ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-[1.03]'
          : 'border-gray-200 bg-white hover:border-emerald-400 hover:shadow-md active:scale-95'}
      `}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">{part.name}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${SLOT_COLOR[part.slot]}`}>
            {getSlotLabel(part.slot)}
          </span>
        </div>
        <span className="text-gray-300 text-lg leading-none">›</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {mods.map((m, i) => (
          <span key={i} className={`text-xs px-1.5 py-0.5 rounded font-medium ${m.good ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {m.label}
          </span>
        ))}
        {mods.length === 0 && <span className="text-xs text-gray-400">補正なし</span>}
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PartsDraftScreen({ state, dispatch, myTurn = true }: Props) {
  const [previewPart, setPreviewPart] = useState<Part | null>(null);

  const player = state.players[state.currentDraftPlayerIndex];
  const totalPicks = 2 * state.playerCount;
  const progress = state.partsPicksDone;
  const phaseLabel = state.partsPhase === 'front' ? '前半（1〜9枚目）' : '後半（10〜18枚目）';

  function handleConfirmPick() {
    if (!previewPart) return;
    dispatch({ type: 'SELECT_PART', partId: previewPart.id });
    setPreviewPart(null);
  }

  return (
    <div className="min-h-screen bg-emerald-900 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-3 bg-white/10 rounded-full px-6 py-2">
            <h1 className="text-lg font-bold text-white">パーツドラフト — {phaseLabel}</h1>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white/10 rounded-xl p-3 mb-4">
          <div className="flex justify-between text-white text-sm mb-1">
            <span>進捗: {progress} / {totalPicks} ピック</span>
            <span>残り: {state.currentDraftParts.length} 枚</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${(progress / totalPicks) * 100}%` }}
            />
          </div>
        </div>

        {/* Draft order */}
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: totalPicks }).map((_, i) => {
            const pIdx = (state.startPlayerIndex + i) % state.playerCount;
            const p = state.players[pIdx];
            const isDone = i < progress;
            const isCurrent = i === progress;
            return (
              <div key={i} className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2
                ${isCurrent ? COLOR_CLASS[p.color] + ' scale-125 shadow-lg' : isDone ? 'bg-white/20 border-white/30 text-white/50' : 'bg-white/10 border-white/20 text-white/40'}
              `}>
                {COLOR_LABEL[p.color]}
              </div>
            );
          })}
        </div>

        {/* Current player */}
        <div className={`text-center mb-4 p-3 rounded-xl border-2 ${COLOR_CLASS[player.color]}`}>
          <p className="text-white/80 text-sm">選択中</p>
          <p className="text-xl font-bold text-white">{player.name}</p>
          <p className="text-white/80 text-sm">パーツをタップしてシミュレーション確認 → 選択</p>
        </div>

        {/* Available parts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {state.currentDraftParts.map(part => (
            <PartCard
              key={part.id}
              part={part}
              previewing={previewPart?.id === part.id}
              onClick={() => setPreviewPart(previewPart?.id === part.id ? null : part)}
            />
          ))}
        </div>

        {/* Players' picked parts */}
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-white/70 text-sm mb-2">各プレイヤーの取得パーツ</p>
          <div className="grid grid-cols-2 gap-3">
            {state.players.map((p) => (
              <div key={p.id} className="bg-white/10 rounded-lg p-2">
                <p className={`text-sm font-bold mb-1 ${['text-rose-300','text-emerald-300','text-slate-300','text-violet-300'][p.id]}`}>
                  {p.name} ({p.parts.length}/4枚)
                </p>
                {p.parts.length === 0 ? (
                  <p className="text-white/40 text-xs">未取得</p>
                ) : (
                  <div className="space-y-0.5">
                    {p.parts.map(pt => (
                      <p key={pt.id} className="text-white/70 text-xs">• {pt.name}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simulation bottom sheet */}
      {previewPart && (
        <SimulationPanel
          part={previewPart}
          horses={player.horses}
          myTurn={myTurn}
          onConfirm={handleConfirmPick}
          onClose={() => setPreviewPart(null)}
        />
      )}
    </div>
  );
}
