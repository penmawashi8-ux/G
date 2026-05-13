import React from 'react';
import { Player } from '../types';
import { COLOR_BG_LIGHT, COLOR_BORDER, COLOR_LABEL } from '../data';

interface Props {
  players: Player[];
  raceDistance: number;
}

const PLAYER_BG_SOLID = ['bg-rose-500', 'bg-emerald-500', 'bg-slate-700', 'bg-violet-500'];
const PLAYER_TEXT_LIGHT = ['text-rose-600', 'text-emerald-600', 'text-slate-600', 'text-violet-600'];
const PLAYER_RING = ['ring-rose-400', 'ring-emerald-400', 'ring-slate-400', 'ring-violet-400'];

export default function TrackBoard({ players, raceDistance }: Props) {
  // Build a map: position -> list of (playerIndex, horseIndex, horseName)
  type Token = { playerIndex: number; horseIndex: number; name: string };
  const posMap = new Map<number, Token[]>();

  players.forEach((p, pi) => {
    p.horses.forEach((h, hi) => {
      if (h.fallen) return;
      const pos = Math.min(h.position, raceDistance);
      if (!posMap.has(pos)) posMap.set(pos, []);
      posMap.get(pos)!.push({ playerIndex: pi, horseIndex: hi, name: h.base.name });
    });
  });

  const cellSize = raceDistance <= 12 ? 'w-14' : raceDistance <= 16 ? 'w-11' : 'w-9';
  const textSize = raceDistance <= 16 ? 'text-xs' : 'text-[10px]';

  // Show each active horse as a lane row
  const horseRows: { playerIndex: number; horseIndex: number; horse: Player['horses'][0] }[] = [];
  players.forEach((p, pi) => {
    p.horses.forEach((h, hi) => {
      horseRows.push({ playerIndex: pi, horseIndex: hi, horse: h });
    });
  });

  return (
    <div className="bg-white rounded-xl p-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700">🏁 レーストラック</h3>
        <span className="text-sm text-gray-500">ゴール: {raceDistance} マス</span>
      </div>

      {/* Column headers */}
      <div className="flex gap-1 mb-1 ml-28">
        <div className="w-8 text-center text-[10px] text-gray-400 font-medium">S</div>
        {Array.from({ length: raceDistance - 1 }).map((_, i) => (
          <div key={i + 1} className={`${cellSize} text-center ${textSize} text-gray-300`}>
            {i + 1}
          </div>
        ))}
        <div className={`${cellSize} text-center ${textSize} font-bold text-emerald-600`}>🏁</div>
      </div>

      {/* Horse rows */}
      <div className="space-y-1">
        {horseRows.map(({ playerIndex, horseIndex, horse }) => {
          const pi = playerIndex;
          const pos = Math.min(horse.position, raceDistance);
          const isFallen = horse.fallen;
          return (
            <div
              key={`${pi}-${horseIndex}`}
              className={`flex items-center gap-1 ${isFallen ? 'opacity-40' : ''}`}
            >
              {/* Horse label */}
              <div className={`w-28 flex items-center gap-1.5 shrink-0`}>
                <div className={`w-3 h-3 rounded-full shrink-0 ${PLAYER_BG_SOLID[pi]}`} />
                <div className="text-xs min-w-0">
                  <p className={`font-bold truncate ${PLAYER_TEXT_LIGHT[pi]}`}>{COLOR_LABEL[players[pi].color]}</p>
                  <p className="text-gray-500 truncate">{horse.base.name}</p>
                </div>
              </div>

              {/* Track cells */}
              {Array.from({ length: raceDistance + 1 }).map((_, cellPos) => {
                const hasHorse = !isFallen && pos === cellPos;
                const isGoal = cellPos === raceDistance;
                const isStart = cellPos === 0;
                return (
                  <div
                    key={cellPos}
                    className={`
                      ${isStart ? 'w-8' : cellSize} h-8 flex items-center justify-center rounded
                      ${isGoal
                        ? 'bg-emerald-100 border-2 border-emerald-400'
                        : isStart
                          ? 'bg-gray-100 border border-gray-200'
                          : 'bg-gray-50 border border-gray-200'}
                      ${hasHorse && isGoal ? 'bg-emerald-300' : ''}
                    `}
                  >
                    {hasHorse ? (
                      <div
                        className={`w-6 h-6 rounded-full ${PLAYER_BG_SOLID[pi]} flex items-center justify-center ring-2 ${PLAYER_RING[pi]} shadow`}
                        title={`${players[pi].name}: ${horse.base.name} (位置: ${pos})`}
                      >
                        <span className="text-white text-[10px] font-bold">
                          {horse.base.name.slice(-1)}
                        </span>
                      </div>
                    ) : isGoal ? (
                      <span className="text-emerald-500 text-xs">🏁</span>
                    ) : null}
                  </div>
                );
              })}

              {/* Damage bar */}
              {!isFallen && (
                <div className="ml-1 text-xs text-gray-500 whitespace-nowrap">
                  💔{horse.damage}
                </div>
              )}
              {isFallen && (
                <div className="ml-1 text-xs text-gray-400">脱落</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
