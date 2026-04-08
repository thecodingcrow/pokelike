import { useMachine } from '@xstate/react';
import type { StateValue } from 'xstate';
import { gameMachine } from './machines/gameMachine';
import { GameContext } from './hooks/useGame';
import { ScreenRouter } from './screens/ScreenRouter';
import { ModalRouter } from './screens/ModalRouter';

/**
 * Extract the top-level state name from an XState StateValue.
 * Nested states (e.g. battle.computing) always return the top key ('battle').
 */
function getScreenFromState(value: StateValue): string {
  if (typeof value === 'string') return value;
  // Object form: { battle: 'computing' } → 'battle'
  const keys = Object.keys(value);
  return keys[0] ?? 'title';
}

export default function App() {
  const [state, send] = useMachine(gameMachine);

  const screen = getScreenFromState(state.value);

  return (
    <GameContext.Provider value={{ state, send }}>
      <div className="min-h-dvh crt-overlay" style={{ backgroundColor: '#0a0a0f' }}>
        <div
          className="w-full max-w-[480px] min-h-dvh mx-auto relative overflow-hidden"
          style={{
            borderLeft:  '2px solid rgba(255,255,255,0.1)',
            borderRight: '2px solid rgba(255,255,255,0.1)',
          }}
        >
          <ScreenRouter screen={screen} />
          <ModalRouter />
        </div>
      </div>
    </GameContext.Provider>
  );
}
