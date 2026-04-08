import { useGame } from '@/hooks/useGame';

export function TransitionScreen() {
  const { state } = useGame();
  const msg = (state.context.transitionMsg as string) || '';
  const sub = (state.context.transitionSub as string) || '';

  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh bg-game-bg px-4 gap-6"
      style={{
        animation: 'fadeInSteps 400ms steps(4, end) forwards',
      }}
    >
      <style>{`
        @keyframes fadeInSteps {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Decorative top bar */}
      <div className="w-32 h-[2px] bg-white opacity-40" />

      {/* Main message */}
      <p className="font-pixel text-[14px] text-white text-center leading-[1.8]">
        {msg}
      </p>

      {/* Sub message */}
      <p className="font-terminal text-[22px] text-[#94a3b8] text-center">
        {sub}
      </p>

      {/* Decorative bottom bar */}
      <div className="w-32 h-[2px] bg-white opacity-40" />
    </div>
  );
}
