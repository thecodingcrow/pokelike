import { useState } from 'react';
import { TrainerSprite } from '@/components/ui/TrainerSprite';
import { useGame } from '@/hooks/useGame';

type TrainerOption = 'boy' | 'girl';

interface TrainerCardProps {
  trainer: TrainerOption;
  label: string;
  spriteName: string;
  selected: boolean;
  onSelect: (trainer: TrainerOption) => void;
}

function TrainerCard({ trainer, label, spriteName, selected, onSelect }: TrainerCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onSelect(trainer)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(trainer);
      }}
      className={[
        'bg-game-panel border-2 shadow-pixel p-4 cursor-pointer',
        'flex flex-col items-center gap-2',
        'transition-none',
        'hover:-translate-y-1 hover:shadow-pixel-lg',
        'active:translate-y-0.5 active:shadow-none',
        selected ? 'border-[#f8d030]' : 'border-[#c8a96e]',
      ].join(' ')}
    >
      <TrainerSprite name={spriteName} size={96} />
      <span className="font-terminal text-[24px] text-[#f0ead6] tracking-wide">
        {label}
      </span>
    </div>
  );
}

export function TrainerSelectScreen() {
  const { send } = useGame();
  const [selected, setSelected] = useState<TrainerOption | null>(null);

  function handleSelect(trainer: TrainerOption) {
    setSelected(trainer);
    // Short delay so the selection highlight is visible before transitioning
    setTimeout(() => {
      send({ type: 'SELECT_TRAINER', trainer });
    }, 120);
  }

  return (
    <div className="screen-default flex flex-col items-center justify-center h-full px-6 gap-10">
      <h2 className="font-pixel text-[12px] text-[#f0ead6] leading-[1.8] text-center">
        Choose your trainer
      </h2>

      <div className="flex gap-8 justify-center flex-wrap">
        <TrainerCard
          trainer="boy"
          label="BOY"
          spriteName="red"
          selected={selected === 'boy'}
          onSelect={handleSelect}
        />
        <TrainerCard
          trainer="girl"
          label="GIRL"
          spriteName="dawn"
          selected={selected === 'girl'}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
