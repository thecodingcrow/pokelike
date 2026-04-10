interface HpBarProps {
  current: number;
  max: number;
  label?: string;
  showNumbers?: boolean;
}

export function HpBar({ current, max, label, showNumbers = false }: HpBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  const barColor =
    pct > 50 ? '#22c55e' :
    pct > 20 ? '#f59e0b' :
               '#dc2626';

  const isLow = pct <= 20;

  const fmt = (n: number) => String(Math.max(0, Math.floor(n))).padStart(3, '0');

  return (
    <div style={{ imageRendering: 'pixelated' }}>
      {label && (
        <div className="font-pixel text-[8px] text-[#f0ead6] mb-1 uppercase">
          {label}
        </div>
      )}
      <div className="hp-bar-container">
        <div
          className={`hp-bar-fill${isLow ? ' animate-blink-fast' : ''}`}
          style={{
            width: `${pct}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      {showNumbers && (
        <div className="font-mono text-[10px] text-[#f0ead6] mt-0.5 text-right">
          {fmt(current)}/{fmt(max)}
        </div>
      )}
    </div>
  );
}
