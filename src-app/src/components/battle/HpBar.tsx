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
      {/* Inline styles duplicate the CSS class as a hard fallback so the bar
          renders correctly at any width, including the 56px roster slot on
          mobile where CSS class application may race against first paint. */}
      <div
        className="hp-bar-container"
        style={{
          border: '2px solid #c8a96e',
          height: '8px',
          background: '#0f1410',
          overflow: 'hidden',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div
          className={isLow ? 'animate-blink-fast' : undefined}
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: barColor,
            display: 'block',
            transition: 'width 250ms linear, background-color 250ms linear',
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
