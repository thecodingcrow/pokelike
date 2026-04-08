import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import type { GameSettings, PokedexEntry, ShinyDexEntry, HallOfFameEntry, Achievement } from '@/types/game';
import type { PokemonInstance, PokemonType } from '@/types/pokemon';

// ── Achievement catalogue (mirrors data.js ACHIEVEMENTS) ─────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'gym_0',            name: 'Boulder Basher',         desc: 'Defeat Brock for the first time',                                                           icon: '🪨' },
  { id: 'gym_1',            name: 'Cascade Crusher',        desc: 'Defeat Misty for the first time',                                                           icon: '💧' },
  { id: 'gym_2',            name: 'Thunder Tamer',          desc: 'Defeat Lt. Surge for the first time',                                                       icon: '⚡' },
  { id: 'gym_3',            name: 'Rainbow Ranger',         desc: 'Defeat Erika for the first time',                                                           icon: '🌿' },
  { id: 'gym_4',            name: 'Soul Crusher',           desc: 'Defeat Koga for the first time',                                                            icon: '💜' },
  { id: 'gym_5',            name: 'Mind Breaker',           desc: 'Defeat Sabrina for the first time',                                                         icon: '🔮' },
  { id: 'gym_6',            name: 'Volcano Victor',         desc: 'Defeat Blaine for the first time',                                                          icon: '🌋' },
  { id: 'gym_7',            name: 'Earth Shaker',           desc: 'Defeat Giovanni for the first time',                                                        icon: '🌍' },
  { id: 'elite_four',       name: 'Pokemon Master',         desc: 'Defeat the Elite Four & Champion',                                                          icon: '👑' },
  { id: 'elite_10',         name: 'Champion League',        desc: 'Defeat the Elite Four 10 times',                                                            icon: '🏆' },
  { id: 'elite_100',        name: 'Immortal Champion',      desc: 'Defeat the Elite Four 100 times',                                                           icon: '💎' },
  { id: 'starter_1',        name: 'Grass Champion',         desc: 'Beat the game starting with Bulbasaur',                                                     icon: '🌱' },
  { id: 'starter_4',        name: 'Fire Champion',          desc: 'Beat the game starting with Charmander',                                                    icon: '🔥' },
  { id: 'starter_7',        name: 'Water Champion',         desc: 'Beat the game starting with Squirtle',                                                      icon: '🌊' },
  { id: 'solo_run',         name: 'One is Enough',          desc: 'Beat the game with only 1 Pokemon on your team',                                            icon: '⭐' },
  { id: 'pokedex_complete', name: "Gotta Catch 'Em All",   desc: 'Complete the regular Pokédex',                                                              icon: '📖' },
  { id: 'shinydex_complete',name: 'Shiny Hunter',           desc: 'Complete the Shiny Pokédex',                                                                icon: '✨' },
  { id: 'hard_mode_win',    name: 'True Master',            desc: 'Beat the game on Hard Mode — doubles shiny chance on ? nodes in all future runs',           icon: '💀' },
];

const DEFAULT_SETTINGS: GameSettings = {
  autoSkipLevelUp: false,
  autoSkipBattles: false,
  autoSkipAllBattles: false,
};

// ── Store interface ───────────────────────────────────────────────────────────

export interface PersistenceStore {
  // ── Persisted state ──────────────────────────────────────────────────────
  /** Pokédex: keyed by species ID. Uses localStorage key `poke_dex`. */
  pokedex: Record<number, PokedexEntry>;
  /** Shiny Pokédex: keyed by species ID. Uses localStorage key `poke_shiny_dex`. */
  shinydex: Record<number, ShinyDexEntry>;
  /** Array of unlocked achievement IDs. Uses localStorage key `poke_achievements`. */
  achievements: string[];
  /** Hall of Fame run records. Uses localStorage key `poke_hall_of_fame`. */
  hallOfFame: HallOfFameEntry[];
  /** Elite Four win count. Uses localStorage key `poke_elite_wins`. */
  eliteWins: number;
  /** User-facing settings. Uses localStorage key `poke_settings`. */
  settings: GameSettings;

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Mark a species as seen in the Pokédex (won't overwrite an existing caught entry). */
  markSeen: (id: number, name: string, types: PokemonType[], spriteUrl: string) => void;

  /** Mark a species as caught in the Pokédex. */
  markCaught: (id: number, name: string, types: PokemonType[], spriteUrl: string) => void;

  /** Mark a species as caught in the Shiny Pokédex. */
  markShinyCaught: (id: number, name: string, types: PokemonType[], shinySpriteUrl: string) => void;

  /**
   * Unlock an achievement by ID.
   * Returns the Achievement definition if it was newly unlocked, or null if already unlocked.
   */
  unlockAchievement: (id: string) => Achievement | null;

  /** Append a completed-run entry to the Hall of Fame. */
  saveHallOfFame: (team: PokemonInstance[], runNumber: number, hardMode: boolean) => void;

  /** Increment the Elite Four win count and return the new total. */
  incrementEliteWins: () => number;

  /** Merge partial settings over the existing settings object. */
  updateSettings: (partial: Partial<GameSettings>) => void;

  // ── Derived helpers (non-persisted) ──────────────────────────────────────

  /** Returns true when all 151 Gen 1 species are marked as caught. */
  isPokedexComplete: () => boolean;

  /** Returns true when all 151 Gen 1 species are in the shiny dex. */
  isShinyDexComplete: () => boolean;

  /** Returns true when 'hard_mode_win' achievement is unlocked. */
  hasHardModeWin: () => boolean;
}

// ── All 151 Gen 1 catchable species IDs ──────────────────────────────────────
const ALL_GEN1_IDS = Array.from({ length: 151 }, (_, i) => i + 1);

// ── Legacy multi-key localStorage adapter ─────────────────────────────────────

const legacyStorage: StateStorage = {
  getItem: (_name: string): string | null => {
    try {
      let pokedex: Record<number, PokedexEntry> = {};
      let shinydex: Record<number, ShinyDexEntry> = {};
      let achievements: string[] = [];
      let hallOfFame: HallOfFameEntry[] = [];
      let eliteWins = 0;
      let settings: GameSettings = { ...DEFAULT_SETTINGS };

      try { pokedex = JSON.parse(localStorage.getItem('poke_dex') || '{}'); } catch { /* use default */ }
      try { shinydex = JSON.parse(localStorage.getItem('poke_shiny_dex') || '{}'); } catch { /* use default */ }
      try { achievements = JSON.parse(localStorage.getItem('poke_achievements') || '[]'); } catch { /* use default */ }
      try { hallOfFame = JSON.parse(localStorage.getItem('poke_hall_of_fame') || '[]'); } catch { /* use default */ }
      try { eliteWins = parseInt(localStorage.getItem('poke_elite_wins') || '0', 10); } catch { /* use default */ }
      try {
        settings = { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem('poke_settings') || 'null') ?? {}) };
      } catch { /* use default */ }

      return JSON.stringify({
        state: { pokedex, shinydex, achievements, hallOfFame, eliteWins, settings },
        version: 0,
      });
    } catch {
      return null;
    }
  },
  setItem: (_name: string, value: string): void => {
    try {
      const parsed = JSON.parse(value);
      const s = parsed.state;
      localStorage.setItem('poke_dex', JSON.stringify(s.pokedex));
      localStorage.setItem('poke_shiny_dex', JSON.stringify(s.shinydex));
      localStorage.setItem('poke_achievements', JSON.stringify(s.achievements));
      localStorage.setItem('poke_hall_of_fame', JSON.stringify(s.hallOfFame));
      localStorage.setItem('poke_elite_wins', String(s.eliteWins));
      localStorage.setItem('poke_settings', JSON.stringify(s.settings));
    } catch { /* storage full or unavailable */ }
  },
  removeItem: (_name: string): void => {
    ['poke_dex', 'poke_shiny_dex', 'poke_achievements',
     'poke_hall_of_fame', 'poke_elite_wins', 'poke_settings'].forEach((k) =>
      localStorage.removeItem(k)
    );
  },
};

// ── Store creation ────────────────────────────────────────────────────────────

export const usePersistenceStore = create<PersistenceStore>()(
  persist(
    (set, get) => ({
      pokedex: {},
      shinydex: {},
      achievements: [],
      hallOfFame: [],
      eliteWins: 0,
      settings: DEFAULT_SETTINGS,

      markSeen: (id, name, types, spriteUrl) =>
        set((s) => {
          if (s.pokedex[id]) return {};
          return {
            pokedex: {
              ...s.pokedex,
              [id]: { id, name, types, spriteUrl, caught: false },
            },
          };
        }),

      markCaught: (id, name, types, spriteUrl) =>
        set((s) => ({
          pokedex: {
            ...s.pokedex,
            [id]: {
              ...(s.pokedex[id] ?? {}),
              id,
              caught: true,
              name: name || s.pokedex[id]?.name || '',
              types: types || s.pokedex[id]?.types || [],
              spriteUrl: spriteUrl || s.pokedex[id]?.spriteUrl || '',
            },
          },
        })),

      markShinyCaught: (id, name, types, shinySpriteUrl) =>
        set((s) => ({
          shinydex: {
            ...s.shinydex,
            [id]: { id, name, types, shinySpriteUrl },
          },
        })),

      unlockAchievement: (id) => {
        const s = get();
        if (s.achievements.includes(id)) return null;
        set({ achievements: [...s.achievements, id] });
        return ACHIEVEMENTS.find((a) => a.id === id) ?? null;
      },

      saveHallOfFame: (team, runNumber, hardMode) =>
        set((s) => ({
          hallOfFame: [
            ...s.hallOfFame,
            {
              runNumber,
              hardMode: !!hardMode,
              date: new Date().toLocaleDateString(),
              team: team.map((p) => ({
                speciesId: p.speciesId,
                name: p.name,
                nickname: p.nickname ?? null,
                level: p.level,
                types: p.types,
                spriteUrl: p.spriteUrl,
                isShiny: !!p.isShiny,
              })),
            },
          ],
        })),

      incrementEliteWins: () => {
        const wins = get().eliteWins + 1;
        set({ eliteWins: wins });
        return wins;
      },

      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      // ── Derived helpers ────────────────────────────────────────────────────

      isPokedexComplete: () => {
        const { pokedex } = get();
        return ALL_GEN1_IDS.every((id) => pokedex[id]?.caught);
      },

      isShinyDexComplete: () => {
        const { shinydex } = get();
        return ALL_GEN1_IDS.every((id) => !!shinydex[id]);
      },

      hasHardModeWin: () => get().achievements.includes('hard_mode_win'),
    }),
    {
      name: 'pokelike-persistence',
      /**
       * Partition the persisted state into the original localStorage keys so
       * existing saves from the vanilla JS version are fully backward-compatible.
       *
       * Zustand's `persist` middleware serialises as a single JSON blob by
       * default, but we override `getItem`/`setItem`/`removeItem` to split the
       * state across the legacy keys instead.
       */
      storage: createJSONStorage(() => legacyStorage),
      // Only persist the data fields; actions and helpers are rehydrated automatically.
      partialize: (s) => ({
        pokedex: s.pokedex,
        shinydex: s.shinydex,
        achievements: s.achievements,
        hallOfFame: s.hallOfFame,
        eliteWins: s.eliteWins,
        settings: s.settings,
      }) as unknown as PersistenceStore,
    }
  )
);
