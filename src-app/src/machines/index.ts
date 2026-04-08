/**
 * machines/index.ts — Public API for the game state machine.
 *
 * Import `gameMachine` to instantiate via `useMachine` in App.tsx.
 * Import types as needed for strongly-typed event dispatch.
 */

export { gameMachine } from './gameMachine';
export type { MachineContext, MachineEvents } from './gameMachine';
