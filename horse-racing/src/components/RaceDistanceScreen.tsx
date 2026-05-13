import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import { GameAction } from '../gameReducer';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export default function RaceDistanceScreen({ state, dispatch }: Props) {
  const [animating, setAnimating] = useState(false);
  const [displayDie, setDisplayDie] = useState<number | null>(null);

  function handleRoll() {
    setAnimating(true);
    let count = 0;
    const interval = setInterval(() => {
      setDisplayDie(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 12) {
        clearInterval(interval);
        dispatch({ type: 'ROLL_RACE_DISTANCE' });
        setAnimating(false);
      }
    }, 80);
  }

  useEffect(() => {
    if (state.raceDistanceDie !== null) {
      setDisplayDie(state.raceDistanceDie);
    }
  }, [state.raceDistanceDie]);

  const die = state.raceDistanceDie ?? displayDie;
  const distance = state.raceDistance;
  const distanceLabel = distance === 12 ? '短距離' : distance === 16 ? '中距離' : '長距離';
  const distanceColor = distance === 12 ? 'text-green-400' : distance === 16 ? 'text-yellow-400' : 'text-orange-400';

  const dieFaces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  return (
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-emerald-800 mb-2">レース距離の決定</h2>
        <p className="text-gray-500 mb-8">サイコロを振ってレース距離を決定します</p>

        {/* Die display */}
        <div className={`text-9xl mb-6 transition-all ${animating ? 'animate-bounce' : ''}`}>
          {die ? dieFaces[die] : '🎲'}
        </div>

        {/* Result */}
        {state.raceDistanceDie !== null && !animating && (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-500 text-sm">出目 {state.raceDistanceDie}</p>
            <p className={`text-4xl font-bold mt-1 ${distanceColor}`}>{distanceLabel}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{distance} マス</p>
            <div className="mt-3 flex justify-center gap-1">
              {Array.from({ length: distance }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm ${
                    distance === 12 ? 'bg-green-400' : distance === 16 ? 'bg-yellow-400' : 'bg-orange-400'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Distance guide */}
        <div className="grid grid-cols-3 gap-2 mb-8 text-xs text-gray-500">
          <div className={`p-2 rounded-lg ${distance === 12 ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50'}`}>
            <p className="font-medium text-green-700">出目1-2</p>
            <p>短距離</p>
            <p className="font-bold text-green-700">12マス</p>
          </div>
          <div className={`p-2 rounded-lg ${distance === 16 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-gray-50'}`}>
            <p className="font-medium text-yellow-700">出目3-4</p>
            <p>中距離</p>
            <p className="font-bold text-yellow-700">16マス</p>
          </div>
          <div className={`p-2 rounded-lg ${distance === 20 ? 'bg-orange-50 border-2 border-orange-300' : 'bg-gray-50'}`}>
            <p className="font-medium text-orange-700">出目5-6</p>
            <p>長距離</p>
            <p className="font-bold text-orange-700">20マス</p>
          </div>
        </div>

        {state.raceDistanceDie === null ? (
          <button
            onClick={handleRoll}
            disabled={animating}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            🎲 サイコロを振る
          </button>
        ) : (
          <button
            onClick={() => dispatch({ type: 'CONFIRM_RACE_DISTANCE' })}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            確定 →
          </button>
        )}
      </div>
    </div>
  );
}
