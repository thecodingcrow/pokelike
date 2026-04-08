import type { ComponentType } from 'react';
import { TitleScreen } from './TitleScreen';
import { TrainerSelectScreen } from './TrainerSelectScreen';
import { StarterSelectScreen } from './StarterSelectScreen';
import { MapScreen } from './MapScreen';
import { BadgeScreen } from './BadgeScreen';
import { TransitionScreen } from './TransitionScreen';
import { GameOverScreen } from './GameOverScreen';
import { WinScreen } from './WinScreen';
import { BattleScreen } from './BattleScreen';
import { CatchScreen } from './CatchScreen';
import { ItemScreen } from './ItemScreen';
import { SwapScreen } from './SwapScreen';
import { TradeScreen } from './TradeScreen';
import { ShinyScreen } from './ShinyScreen';

// ── Screen map ─────────────────────────────────────────────────────────────────
const SCREEN_MAP: Record<string, ComponentType> = {
  title:          TitleScreen,
  trainerSelect:  TrainerSelectScreen,
  starterSelect:  StarterSelectScreen,
  map:            MapScreen,
  battle:         BattleScreen,
  catch:          CatchScreen,
  item:           ItemScreen,
  swap:           SwapScreen,
  trade:          TradeScreen,
  shiny:          ShinyScreen,
  badge:          BadgeScreen,
  transition:     TransitionScreen,
  gameOver:       GameOverScreen,
  win:            WinScreen,
};

interface ScreenRouterProps {
  screen: string;
}

export function ScreenRouter({ screen }: ScreenRouterProps) {
  const Component = SCREEN_MAP[screen] ?? (() => (
    <div className="flex items-center justify-center min-h-dvh bg-[#0a0a0f]">
      <div className="font-pixel text-[10px] text-white border-2 border-white p-4 shadow-[4px_4px_0px_#000]">
        Unknown: {screen}
      </div>
    </div>
  ));

  return <Component />;
}
