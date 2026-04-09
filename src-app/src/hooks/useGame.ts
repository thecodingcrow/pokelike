import { createContext, useContext } from 'react';
import type { StateFrom } from 'xstate';
import type { MachineEvents } from '@/machines/gameMachine';
import { gameMachine } from '@/machines/gameMachine';

interface GameContextValue {
  state: StateFrom<typeof gameMachine>;
  send: (event: MachineEvents) => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameContext.Provider');
  return ctx;
}
