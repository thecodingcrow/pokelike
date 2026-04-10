import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { playAttackAnimation } from '@/systems/battle-anim-moves';

export interface BattleCanvasHandle {
  playAnimation(
    moveType: string,
    from: { x: number; y: number },
    to: { x: number; y: number },
    isSpecial: boolean,
    moveName: string,
    speed: number,
  ): Promise<void>;
  getCtx(): CanvasRenderingContext2D | null;
}

export const BattleCanvas = forwardRef<BattleCanvasHandle>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize canvas to match container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(devicePixelRatio, devicePixelRatio);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    playAnimation: async (moveType, from, to, isSpecial, moveName, speed) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      await playAttackAnimation(ctx, moveType, from, to, isSpecial, moveName, speed);
    },
    getCtx: () => canvasRef.current?.getContext('2d') ?? null,
  }));

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 40 }}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
});

BattleCanvas.displayName = 'BattleCanvas';
