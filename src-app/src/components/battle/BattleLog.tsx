import { useState, useEffect, useRef } from 'react';

interface BattleLogProps {
  messages: { text: string; className: string }[];
  currentMessage?: string;
  speedMultiplier?: number;
}

export function BattleLog({ messages, currentMessage, speedMultiplier = 1 }: BattleLogProps) {
  const [revealed, setRevealed] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayText = currentMessage ?? (messages[messages.length - 1]?.text ?? '');

  useEffect(() => {
    if (!displayText) {
      setRevealed('');
      setIsComplete(false);
      return;
    }

    setRevealed('');
    setIsComplete(false);

    let idx = 0;
    const charDelay = Math.max(1, Math.floor(40 / speedMultiplier));

    const interval = setInterval(() => {
      idx++;
      setRevealed(displayText.slice(0, idx));
      if (idx >= displayText.length) {
        clearInterval(interval);
        setIsComplete(true);
      }
    }, charDelay);

    return () => clearInterval(interval);
  }, [displayText, speedMultiplier]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, revealed]);

  return (
    <div className="dialog-rpg z-[60]">
      {/* Previous messages (last 2) */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-hidden"
        aria-live="polite"
      >
        {messages.length > 1 && (
          <div className="text-white/40 text-[18px] font-terminal leading-tight mb-1 line-clamp-1">
            {messages[messages.length - 2]?.text}
          </div>
        )}
        <div className="text-white font-terminal text-[22px] leading-snug min-h-[1.4em]">
          {revealed}
          {isComplete && (
            <span className="animate-blink ml-1 text-white">▼</span>
          )}
        </div>
      </div>
    </div>
  );
}
