import React, { useReducer } from 'react';
import { gameReducer, initialState } from './gameReducer';
import StartScreen from './components/StartScreen';
import HorseDraftScreen from './components/HorseDraftScreen';
import RaceDistanceScreen from './components/RaceDistanceScreen';
import PartsDraftScreen from './components/PartsDraftScreen';
import EquipScreen from './components/EquipScreen';
import RaceScreen from './components/RaceScreen';
import GameOverScreen from './components/GameOverScreen';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  switch (state.phase) {
    case 'start':
      return <StartScreen state={state} dispatch={dispatch} />;
    case 'honmei-draft':
    case 'taikou-draft':
      return <HorseDraftScreen state={state} dispatch={dispatch} />;
    case 'race-distance':
      return <RaceDistanceScreen state={state} dispatch={dispatch} />;
    case 'parts-draft':
      return <PartsDraftScreen state={state} dispatch={dispatch} />;
    case 'equip':
      return <EquipScreen state={state} dispatch={dispatch} />;
    case 'race':
      return <RaceScreen state={state} dispatch={dispatch} />;
    case 'game-over':
      return <GameOverScreen state={state} dispatch={dispatch} />;
    default:
      return <StartScreen state={state} dispatch={dispatch} />;
  }
}
