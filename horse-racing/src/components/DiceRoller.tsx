import React from 'react';

interface Props {
  dieValue: number;
  speed: number;
  action: 'advance' | 'obstruct';
  onConfirm: () => void;
}

const dieFaces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function DiceRoller({ dieValue, speed, action, onConfirm }: Props) {
  const success = dieValue > speed;

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-center text-xs text-gray-500 mb-3 font-medium">
        スピード（{speed}）より大きい目が出たら成功
      </p>

      {/* Die + result */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className={`w-20 h-20 rounded-2xl border-4 flex items-center justify-center text-5xl shadow-md select-none
          ${success ? 'border-emerald-400 bg-emerald-50' : 'border-red-300 bg-red-50'}`}>
          {dieFaces[dieValue]}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <span>出目</span>
            <span className="font-black text-2xl text-gray-900">{dieValue}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>スピード</span>
            <span className="font-bold">{speed}</span>
          </div>
          <div className={`mt-1 px-3 py-1 rounded-full text-sm font-bold text-center
            ${success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
            {success ? '成功！ ✓' : '失敗…'}
          </div>
        </div>
      </div>

      {/* Outcome */}
      <div className={`rounded-lg px-4 py-2 mb-4 text-center text-sm font-semibold
        ${success
          ? action === 'advance' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          : 'bg-gray-100 text-gray-500'}`}>
        {success
          ? action === 'advance'
            ? `🏃 ${dieValue} マス前進！`
            : `⚔️ 1 ダメージ！`
          : '行動できませんでした'}
      </div>

      <button
        onClick={onConfirm}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl transition-all"
      >
        確定 →
      </button>
    </div>
  );
}
