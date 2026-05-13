import React, { useState, useEffect } from 'react';

interface Props {
  values: number[];
  rerolled: boolean[];
  rerollsRemaining: number;
  motivation: number;
  onReroll: (index: number) => void;
  onConfirm: () => void;
  phase: 'rolling' | 'reroll' | 'done';
}

const dieFaces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function DiceRoller({ values, rerolled, rerollsRemaining, motivation, onReroll, onConfirm, phase }: Props) {
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);

  const validCount = values.filter(v => v <= motivation).length;

  function handleReroll(i: number) {
    if (rerolled[i] || rerollsRemaining <= 0) return;
    setAnimatingIndex(i);
    setTimeout(() => setAnimatingIndex(null), 400);
    onReroll(i);
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700">🎲 サイコロ</h3>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">やる気≤<span className="font-bold text-orange-500">{motivation}</span>が有効</span>
          {rerollsRemaining > 0 && (
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
              リロール残り: {rerollsRemaining}
            </span>
          )}
        </div>
      </div>

      {/* Dice */}
      <div className="flex flex-wrap gap-3 justify-center mb-4">
        {values.map((v, i) => {
          const isValid = v <= motivation;
          const canReroll = rerollsRemaining > 0 && !rerolled[i] && phase === 'reroll';
          const isAnimating = animatingIndex === i;

          return (
            <div
              key={i}
              onClick={() => canReroll && handleReroll(i)}
              className={`
                relative w-16 h-16 rounded-xl border-3 flex items-center justify-center
                text-4xl select-none transition-all
                ${isAnimating ? 'scale-125 rotate-12' : ''}
                ${isValid
                  ? 'border-emerald-400 bg-emerald-50 shadow-md'
                  : 'border-gray-300 bg-gray-50 opacity-50'}
                ${canReroll ? 'cursor-pointer hover:scale-110 hover:border-purple-400 hover:bg-purple-50' : ''}
                ${rerolled[i] ? 'ring-2 ring-orange-300' : ''}
              `}
            >
              <span>{dieFaces[v] || v}</span>
              {isValid && (
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[9px]">✓</span>
                </div>
              )}
              {rerolled[i] && (
                <div className="absolute -bottom-1.5 -right-1.5 text-[10px] bg-orange-200 rounded px-0.5">↺</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Result summary */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3 text-center">
        <p className="text-sm text-gray-600">
          有効サイコロ: <span className="text-xl font-bold text-emerald-600">{validCount}</span> / {values.length} 個
        </p>
        {rerollsRemaining > 0 && phase === 'reroll' && (
          <p className="text-xs text-purple-600 mt-1">
            サイコロをクリックしてリロール（各サイコロ1回まで）
          </p>
        )}
      </div>

      <button
        onClick={onConfirm}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
      >
        {rerollsRemaining > 0 ? `結果確定（リロールしない）` : '結果確定'}
      </button>
    </div>
  );
}
