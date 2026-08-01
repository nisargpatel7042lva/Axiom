export const BRAND = {
  bg: '#080c14',
  surface: '#0d1420',
  border: '#1a2235',
  accent: '#00e5c3',
  indigo: '#6366f1',
  violet: '#a855f7',
  text: '#e8edf5',
  muted: '#8b9cb3',
};

export const VAULTS = [
  {
    id: 'safe-consensus',
    name: 'Safe Consensus',
    ticker: 'AXM-SC',
    description: 'High-probability consensus events. Capital-protected yield.',
    apyMin: 4,
    apyMax: 10,
    risk: 'Low Risk',
    accentColor: '#00e5c3',
    glowColor: 'rgba(0, 229, 195, 0.25)',
    icon: 'shield' as const,
  },
  {
    id: 'macro-contrarian',
    name: 'Macro Contrarian',
    ticker: 'AXM-MC',
    description: 'Mispriced political and economic events. Alpha extraction.',
    apyMin: 8,
    apyMax: 22,
    risk: 'Medium Risk',
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    icon: 'target' as const,
  },
  {
    id: 'yield-maximizer',
    name: 'Yield Maximizer',
    ticker: 'AXM-YM',
    description: 'Max yield from lending + high-conviction predictions.',
    apyMin: 10,
    apyMax: 28,
    risk: 'High Risk',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    icon: 'gem' as const,
  },
] as const;

// 30s Twitter clip — 900 frames @ 30fps
export const SCENES = {
  HOOK:     { start: 0,   end: 90  },
  ANGLE:    { start: 90,  end: 250 },
  SOLUTION: { start: 250, end: 450 },
  VAULTS:   { start: 450, end: 760 },
  CTA:      { start: 760, end: 900 },
} as const;

// 45s Landing Hero — 1350 frames @ 30fps
export const SCENES_HERO = {
  HOOK:     { start: 0,   end: 120  },
  ANGLE:    { start: 120, end: 330  },
  SOLUTION: { start: 330, end: 570  },
  HOWITWORKS: { start: 570, end: 840 },
  VAULTS:   { start: 840, end: 1200 },
  CTA:      { start: 1200, end: 1350 },
} as const;
