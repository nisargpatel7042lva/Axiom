import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { Shield, Target, Gem } from 'lucide-react';
import type { VAULTS } from '../constants';
import { BRAND } from '../constants';

type VaultData = (typeof VAULTS)[number];

const ICONS = {
  shield: Shield,
  target: Target,
  gem: Gem,
} as const;

interface VaultCardProps {
  vault: VaultData;
  delayFrames?: number;
  /** absolute frame at which this card starts animating in */
  startFrame: number;
}

export const VaultCard: React.FC<VaultCardProps> = ({ vault, delayFrames = 0, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - startFrame - delayFrames;

  const scale = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 120, mass: 1 },
  });

  const translateY = interpolate(scale, [0, 1], [48, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const opacity = interpolate(localFrame, [0, 12], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const Icon = ICONS[vault.icon];

  const riskColor = {
    'Low Risk': vault.accentColor,
    'Medium Risk': vault.accentColor,
    'High Risk': vault.accentColor,
  }[vault.risk];

  const riskBg = `${riskColor}20`;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${interpolate(scale, [0, 1], [0.95, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' })})`,
        width: 380,
        background: 'linear-gradient(160deg, #0d1420 0%, #0a1018 100%)',
        borderRadius: 20,
        border: `1px solid ${BRAND.border}`,
        boxShadow: `0 0 0 1px ${vault.accentColor}30, 0 0 40px ${vault.glowColor}, inset 0 1px 0 rgba(255,255,255,0.04)`,
        padding: '28px 28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${vault.accentColor}18`,
              border: `1px solid ${vault.accentColor}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: vault.accentColor,
              flexShrink: 0,
            }}
          >
            <Icon size={20} strokeWidth={1.8} />
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: BRAND.text,
                lineHeight: 1.2,
                letterSpacing: '-0.3px',
              }}
            >
              {vault.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: BRAND.muted,
                fontFamily: 'monospace',
                marginTop: 2,
                letterSpacing: '0.08em',
              }}
            >
              {vault.ticker}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div
        style={{
          marginTop: 14,
          fontSize: 13,
          color: BRAND.muted,
          lineHeight: 1.6,
        }}
      >
        {vault.description}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' as const }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: vault.accentColor,
            background: riskBg,
            borderRadius: 99,
            padding: '4px 10px',
            letterSpacing: '0.02em',
          }}
        >
          {vault.risk}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: BRAND.muted,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 99,
            padding: '4px 10px',
            fontFamily: 'monospace',
            letterSpacing: '0.02em',
          }}
        >
          {vault.apyMin}–{vault.apyMax}% Target APY
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '18px 0' }} />

      {/* APY Big Number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: vault.accentColor,
            letterSpacing: '-1px',
            lineHeight: 1,
            fontFamily: 'monospace',
          }}
        >
          {vault.apyMax}%
        </span>
        <span style={{ fontSize: 13, color: BRAND.muted, fontWeight: 500 }}>
          max target APY
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          marginTop: 14,
          height: 4,
          borderRadius: 99,
          background: BRAND.border,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: '62%',
            borderRadius: 99,
            background: `linear-gradient(90deg, ${vault.accentColor}80, ${vault.accentColor})`,
          }}
        />
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          color: BRAND.muted,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Strategy allocation</span>
        <span style={{ color: vault.accentColor }}>62%</span>
      </div>
    </div>
  );
};
