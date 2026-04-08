import { useState, useEffect } from 'react';
import { BattleField } from './components/battle/BattleField';
import { useBattlePlayback } from './hooks/useBattlePlayback';
import { runBattle } from './systems/battle';
import type { PokemonInstance } from './types/pokemon';

// Mock Charmander (player, level 15)
const mockPlayer: PokemonInstance = {
  speciesId: 4,
  name: 'Charmander',
  nickname: null,
  level: 15,
  currentHp: 46,
  maxHp: 46,
  isShiny: false,
  types: ['Fire'],
  baseStats: { hp: 39, atk: 52, def: 43, speed: 65, special: 50, spdef: 50 },
  spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/4.png',
  megaStone: null,
  heldItem: null,
  moveTier: 0,
};

// Mock Pidgey (enemy, level 12)
const mockEnemy: PokemonInstance = {
  speciesId: 16,
  name: 'Pidgey',
  nickname: null,
  level: 12,
  currentHp: 35,
  maxHp: 35,
  isShiny: false,
  types: ['Normal', 'Flying'],
  baseStats: { hp: 40, atk: 45, def: 40, speed: 56, special: 35, spdef: 35 },
  spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/16.png',
  megaStone: null,
  heldItem: null,
  moveTier: 0,
};

export default function App() {
  const [battleData] = useState(() => {
    return runBattle([mockPlayer], [mockEnemy], [], []);
  });

  const playback = useBattlePlayback(
    battleData.detailedLog,
    [mockPlayer],
    [mockEnemy],
  );

  // Auto-start on mount
  useEffect(() => {
    const timer = setTimeout(() => playback.start(), 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh crt-overlay" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="w-full max-w-[480px] mx-auto h-[100dvh] relative overflow-hidden"
           style={{ borderLeft: '2px solid rgba(255,255,255,0.1)', borderRight: '2px solid rgba(255,255,255,0.1)' }}>
        <BattleField
          playerTeam={playback.playerTeam}
          enemyTeam={playback.enemyTeam}
          playerActiveIdx={0}
          enemyActiveIdx={0}
          currentEvent={playback.currentEvent}
          logMessages={playback.logMessages}
          isComplete={playback.isComplete}
          onSkip={() => playback.skip()}
          onContinue={() => {
            // Restart battle for demo
            playback.start();
          }}
        />
      </div>
    </div>
  );
}
