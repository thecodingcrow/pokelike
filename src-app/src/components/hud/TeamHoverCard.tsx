import type { PokemonInstance, PokemonType } from '@/types/pokemon';
import { getMove } from '@/systems/battle-calc';
import { useGameStore } from '@/store/gameStore';

interface TeamHoverCardProps {
  pokemon: PokemonInstance | null;
  pokemonIdx: number;
  anchor: { x: number; y: number } | null;
}

const TYPE_COLORS: Record<PokemonType, string> = {
  Normal:   '#a8a878',
  Fire:     '#ff7c5c',
  Water:    '#6ab4f5',
  Electric: '#f8d030',
  Grass:    '#78c850',
  Ice:      '#98d8d8',
  Fighting: '#c03028',
  Poison:   '#a040a0',
  Ground:   '#e0c068',
  Flying:   '#a890f0',
  Psychic:  '#f85888',
  Bug:      '#a8b820',
  Rock:     '#b8a038',
  Ghost:    '#705898',
  Dragon:   '#7038f8',
  Dark:     '#705848',
  Steel:    '#b8b8d0',
};

function hpBarColor(current: number, max: number): string {
  if (max === 0) return '#dc2626';
  const pct = current / max;
  if (pct > 0.5) return '#22c55e';
  if (pct > 0.2) return '#f59e0b';
  return '#dc2626';
}

export function TeamHoverCard({ pokemon, pokemonIdx, anchor }: TeamHoverCardProps) {
  if (!pokemon || !anchor) return null;

  // Suppress on mobile — card overlaps map and is not useful
  if (typeof window !== 'undefined' && window.innerWidth < 640) return null;

  const cardHeight = 300;
  const spaceAbove = anchor.y;
  const placeAbove = spaceAbove > cardHeight;
  const top = placeAbove ? anchor.y - cardHeight - 8 : anchor.y + 8;

  const hpPct = pokemon.maxHp > 0 ? Math.max(0, pokemon.currentHp / pokemon.maxHp) : 0;
  const barColor = hpBarColor(pokemon.currentHp, pokemon.maxHp);

  const move = getMove(pokemon);
  const moveColor = TYPE_COLORS[move.type] ?? '#a8a878';
  const category = move.isSpecial ? 'Special' : 'Physical';

  const stats = pokemon.baseStats;

  function handleUnequip(e: React.MouseEvent) {
    e.stopPropagation();
    useGameStore.getState().unequipItem(pokemonIdx);
  }

  return (
    <div
      className="fixed z-50 pointer-events-auto select-none"
      style={{
        left: anchor.x - 110,
        top,
        width: 220,
        background: '#0d110e',
        border: '2px solid #c8a96e',
        boxShadow: '3px 3px 0 #050805',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* ── Header: sprite + name + level + types ─────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img
          src={pokemon.spriteUrl}
          alt={pokemon.nickname ?? pokemon.name}
          width={48}
          height={48}
          style={{ imageRendering: 'pixelated', flexShrink: 0 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <span
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              color: '#f0ead6',
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            {pokemon.nickname ?? pokemon.name}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: '#c8a96e',
            }}
          >
            Lv {pokemon.level}
          </span>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {pokemon.types.map((t) => (
              <span
                key={t}
                style={{
                  backgroundColor: TYPE_COLORS[t] ?? '#a8a878',
                  color: '#050805',
                  fontFamily: "'VT323', monospace",
                  fontSize: 10,
                  padding: '0 4px',
                  boxShadow: '1px 1px 0 #050805',
                  lineHeight: '14px',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── HP bar ────────────────────────────────────────────────────── */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 3,
            fontFamily: "'VT323', monospace",
            fontSize: 12,
            color: '#c8a96e',
          }}
        >
          <span>HP</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#f0ead6' }}>
            {pokemon.currentHp}/{pokemon.maxHp}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: 6,
            background: '#2a3a2a',
            border: '1px solid #050805',
          }}
        >
          <div
            style={{
              width: `${Math.round(hpPct * 100)}%`,
              height: '100%',
              background: barColor,
              transition: 'none',
            }}
          />
        </div>
      </div>

      {/* ── Stats grid ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Row 1: HP / ATK / DEF */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
          {([['HP', stats.hp], ['ATK', stats.atk], ['DEF', stats.def]] as [string, number][]).map(([label, val]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: '#c8a96e', lineHeight: 1 }}>
                {label}
              </div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: '#f0ead6', lineHeight: 1.2 }}>
                {val}
              </div>
            </div>
          ))}
        </div>
        {/* Row 2: SPD / SP */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
          {([['SPD', stats.speed], ['SP', stats.special], ['', null]] as [string, number | null][]).map(([label, val], i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              {label && val !== null && (
                <>
                  <div style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: '#c8a96e', lineHeight: 1 }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: '#f0ead6', lineHeight: 1.2 }}>
                    {val}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Best move ─────────────────────────────────────────────────── */}
      <div
        style={{
          borderLeft: `3px solid ${moveColor}`,
          paddingLeft: 6,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: '#f0ead6', lineHeight: 1.2 }}>
          {move.name}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ fontFamily: "'VT323', monospace", fontSize: 11, color: '#c8a96e' }}>
            {category}
          </span>
          {move.power > 0 && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#f0ead6' }}>
              PWR {move.power}
            </span>
          )}
        </div>
      </div>

      {/* ── Held item ─────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid #c8a96e30',
          paddingTop: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
        }}
      >
        {pokemon.heldItem ? (
          <>
            <span style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: '#f0ead6' }}>
              {pokemon.heldItem.icon} {pokemon.heldItem.name}
            </span>
            <button
              onClick={handleUnequip}
              style={{
                fontFamily: "'VT323', monospace",
                fontSize: 11,
                color: '#c8a96e',
                background: 'transparent',
                border: '1px solid #c8a96e60',
                padding: '1px 5px',
                cursor: 'pointer',
                lineHeight: 1.4,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#c8a96e';
                (e.currentTarget as HTMLButtonElement).style.color = '#f0ead6';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#c8a96e60';
                (e.currentTarget as HTMLButtonElement).style.color = '#c8a96e';
              }}
            >
              Unequip
            </button>
          </>
        ) : (
          <span style={{ fontFamily: "'VT323', monospace", fontSize: 13, color: '#5a6a4a' }}>
            No item
          </span>
        )}
      </div>
    </div>
  );
}
