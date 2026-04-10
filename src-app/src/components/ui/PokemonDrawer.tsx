import { createPortal } from 'react-dom';
import { useRef, useEffect, useState } from 'react';
import type { PokemonInstance, PokemonType } from '@/types/pokemon';
import { getMove } from '@/systems/battle-calc';


interface PokemonDrawerProps {
  pokemon: PokemonInstance | null;
  teamIndex: number;
  teamSize: number;
  onClose: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUnequip: () => void;
}

const TYPE_COLORS: Record<string, string> = {
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

export function PokemonDrawer({
  pokemon,
  teamIndex,
  teamSize,
  onClose,
  onMoveUp,
  onMoveDown,
  onUnequip,
}: PokemonDrawerProps) {
  const [visible, setVisible] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);

  // Animate in when pokemon becomes non-null
  useEffect(() => {
    if (pokemon) {
      // Small delay to let DOM paint first, then trigger slide-up
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
    }
  }, [pokemon]);

  // Drag-to-dismiss support
  function handleTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0]?.clientY ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (dragStartY.current === null) return;
    const delta = (e.changedTouches[0]?.clientY ?? 0) - dragStartY.current;
    dragStartY.current = null;
    if (delta > 60) {
      onClose();
    }
  }

  if (!pokemon) return null;

  const hpPct = pokemon.maxHp > 0 ? Math.max(0, pokemon.currentHp / pokemon.maxHp) : 0;
  const barColor = hpBarColor(pokemon.currentHp, pokemon.maxHp);
  const move = getMove(pokemon);
  const moveColor = TYPE_COLORS[move.type] ?? '#a8a878';
  const category = move.isSpecial ? 'Special' : 'Physical';
  const stats = pokemon.baseStats;
  const canMoveUp = teamIndex > 0;
  const canMoveDown = teamIndex < teamSize - 1;

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        pointerEvents: 'auto',
      }}
    >
      {/* Scrim */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 250ms ease-out',
        }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '70vh',
          overflowY: 'auto',
          background: '#0d110e',
          border: '2px solid #c8a96e',
          borderBottom: 'none',
          boxShadow: '3px 3px 0 #050805',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '12px 16px 24px',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 250ms ease-out',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4, flexShrink: 0 }}>
          <div
            style={{
              width: 40,
              height: 4,
              background: '#c8a96e60',
              borderRadius: 2,
            }}
          />
        </div>

        {/* ── Header: sprite + name + level + types ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <img
            src={pokemon.spriteUrl}
            alt={pokemon.nickname ?? pokemon.name}
            width={64}
            height={64}
            style={{
              imageRendering: 'pixelated',
              flexShrink: 0,
              filter: pokemon.currentHp <= 0 ? 'grayscale(1)' : 'none',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 10,
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
                fontSize: 12,
                color: '#c8a96e',
              }}
            >
              Lv {pokemon.level}
            </span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {pokemon.types.map((t: PokemonType) => (
                <span
                  key={t}
                  style={{
                    backgroundColor: TYPE_COLORS[t] ?? '#a8a878',
                    color: '#050805',
                    fontFamily: "'VT323', monospace",
                    fontSize: 12,
                    padding: '0 6px',
                    boxShadow: '1px 1px 0 #050805',
                    lineHeight: '18px',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── HP bar ── */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
              fontFamily: "'VT323', monospace",
              fontSize: 14,
              color: '#c8a96e',
            }}
          >
            <span>HP</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: '#f0ead6',
              }}
            >
              {pokemon.currentHp}/{pokemon.maxHp}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
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

        {/* ── Stats grid ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          {/* Row 1: HP / ATK / DEF */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
            {([['HP', stats.hp], ['ATK', stats.atk], ['DEF', stats.def]] as [string, number][]).map(([label, val]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: "'VT323', monospace",
                    fontSize: 14,
                    color: '#c8a96e',
                    lineHeight: 1,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "'VT323', monospace",
                    fontSize: 18,
                    color: '#f0ead6',
                    lineHeight: 1.2,
                  }}
                >
                  {val}
                </div>
              </div>
            ))}
          </div>
          {/* Row 2: SPD / SP */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
            {([['SPD', stats.speed], ['SP', stats.special], ['', null]] as [string, number | null][]).map(([label, val], i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                {label && val !== null && (
                  <>
                    <div
                      style={{
                        fontFamily: "'VT323', monospace",
                        fontSize: 14,
                        color: '#c8a96e',
                        lineHeight: 1,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'VT323', monospace",
                        fontSize: 18,
                        color: '#f0ead6',
                        lineHeight: 1.2,
                      }}
                    >
                      {val}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Best move ── */}
        <div
          style={{
            borderLeft: `3px solid ${moveColor}`,
            paddingLeft: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: "'VT323', monospace",
              fontSize: 16,
              color: '#f0ead6',
              lineHeight: 1.2,
            }}
          >
            {move.name}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span
              style={{
                fontFamily: "'VT323', monospace",
                fontSize: 13,
                color: '#050805',
                background: category === 'Physical' ? '#c47c30' : '#4a8fcf',
                padding: '1px 8px',
                borderRadius: 10,
                lineHeight: '18px',
              }}
            >
              {category}
            </span>
            {move.power > 0 && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: '#c8a96e',
                }}
              >
                PWR {move.power}
              </span>
            )}
          </div>
        </div>

        {/* ── Held item ── */}
        <div
          style={{
            borderTop: '1px solid #c8a96e30',
            paddingTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexShrink: 0,
          }}
        >
          {pokemon.heldItem ? (
            <>
              <span
                style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: 16,
                  color: '#f0ead6',
                }}
              >
                {pokemon.heldItem.icon} {pokemon.heldItem.name}
              </span>
              <button
                onClick={onUnequip}
                style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: 14,
                  color: '#c8a96e',
                  background: 'transparent',
                  border: '1px solid #c8a96e60',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  lineHeight: 1.4,
                  flexShrink: 0,
                  minWidth: 44,
                  minHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Unequip
              </button>
            </>
          ) : (
            <span
              style={{
                fontFamily: "'VT323', monospace",
                fontSize: 16,
                color: '#5a6a4a',
              }}
            >
              No held item
            </span>
          )}
        </div>

        {/* ── Actions: Move Up / Move Down ── */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            style={{
              flex: 1,
              minHeight: 44,
              fontFamily: "'VT323', monospace",
              fontSize: 16,
              color: canMoveUp ? '#f0ead6' : '#5a6a4a',
              background: 'transparent',
              border: `2px solid ${canMoveUp ? '#c8a96e' : '#5a6a4a40'}`,
              cursor: canMoveUp ? 'pointer' : 'not-allowed',
              padding: '8px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            ▲ Move Up
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            style={{
              flex: 1,
              minHeight: 44,
              fontFamily: "'VT323', monospace",
              fontSize: 16,
              color: canMoveDown ? '#f0ead6' : '#5a6a4a',
              background: 'transparent',
              border: `2px solid ${canMoveDown ? '#c8a96e' : '#5a6a4a40'}`,
              cursor: canMoveDown ? 'pointer' : 'not-allowed',
              padding: '8px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            Move Down ▼
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
