import { createContext, useContext } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GameContext = createContext<{ state: any; send: any } | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameContext.Provider');
  return ctx;
}
