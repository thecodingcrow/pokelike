import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

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
    playAnimation: async (_moveType, _from, _to, _isSpecial, _moveName, _speed) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Will be wired to playAttackAnimation in Phase 3
      // For now, just a placeholder that resolves immediately
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
