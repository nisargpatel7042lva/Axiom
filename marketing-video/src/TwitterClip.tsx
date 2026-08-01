import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
  staticFile,
  Easing,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/DMSans';
import { loadFont as loadSpaceMono } from '@remotion/google-fonts/SpaceMono';
import { Aurora } from './components/Aurora';
import { VaultCard } from './components/VaultCard';
import { BRAND, VAULTS, SCENES } from './constants';

const { fontFamily: dmSans } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
});
const { fontFamily: spaceMono } = loadSpaceMono('normal', {
  weights: ['400', '700'],
});

// ─── Scene: Hook ─────────────────────────────────────────────────────────────
const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES.HOOK.end - SCENES.HOOK.start; // 90 frames

  const metricY = spring({ frame, fps, config: { damping: 200, stiffness: 100 } });
  const metricTranslate = interpolate(metricY, [0, 1], [60, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const metricOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const subOpacity = interpolate(frame, [20, 36], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const subY = interpolate(frame, [20, 40], [18, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Glow pulse
  const glowPulse = 0.7 + 0.3 * Math.sin((frame / fps) * Math.PI * 1.4);

  // Fade out last 10 frames
  const fadeOut = interpolate(frame, [dur - 12, dur], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: BRAND.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        opacity: fadeOut,
      }}
    >
      {/* Teal glow behind the number */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(0, 229, 195, ${0.16 * glowPulse}) 0%, transparent 65%)`,
          filter: 'blur(80px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main metric */}
      <div
        style={{
          opacity: metricOpacity,
          transform: `translateY(${metricTranslate}px)`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: dmSans,
            fontSize: 140,
            fontWeight: 800,
            color: BRAND.text,
            lineHeight: 0.9,
            letterSpacing: '-4px',
          }}
        >
          up to{' '}
          <span style={{ color: BRAND.accent }}>28%</span>
        </div>
        <div
          style={{
            fontFamily: spaceMono,
            fontSize: 56,
            fontWeight: 700,
            color: BRAND.text,
            letterSpacing: '-1px',
            marginTop: 12,
          }}
        >
          APY
        </div>
      </div>

      {/* Subtext */}
      <div
        style={{
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          marginTop: 32,
          fontFamily: dmSans,
          fontSize: 28,
          color: BRAND.muted,
          fontWeight: 400,
          letterSpacing: '0.01em',
        }}
      >
        from prediction markets
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene: Angle ─────────────────────────────────────────────────────────────
const SceneAngle: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = SCENES.ANGLE.end - SCENES.ANGLE.start;

  const lines = [
    { text: 'Your stablecoin yield is stagnant.', delay: 8 },
    { text: 'Prediction markets price real-world events.', delay: 40 },
    { text: 'Your USDC can trade them — automatically.', delay: 72, accent: true },
  ];

  const fadeIn = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const fadeOut = interpolate(frame, [dur - 14, dur], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: BRAND.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 0,
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          maxWidth: 900,
          padding: '0 80px',
        }}
      >
        {lines.map(({ text, delay, accent }, i) => {
          const lineOpacity = interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          const lineY = interpolate(frame, [delay, delay + 24], [20, 0], {
            extrapolateRight: 'clamp',
            extrapolateLeft: 'clamp',
            easing: Easing.out(Easing.cubic),
          });

          return (
            <div
              key={i}
              style={{
                opacity: lineOpacity,
                transform: `translateY(${lineY}px)`,
                fontFamily: dmSans,
                fontSize: 46,
                fontWeight: accent ? 700 : 400,
                color: accent ? BRAND.text : BRAND.muted,
                lineHeight: 1.3,
                letterSpacing: '-0.5px',
              }}
            >
              {accent ? (
                <>
                  Your USDC can trade them{' '}
                  <span style={{ color: BRAND.accent }}>— automatically.</span>
                </>
              ) : (
                text
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene: Solution ──────────────────────────────────────────────────────────
const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES.SOLUTION.end - SCENES.SOLUTION.start;

  const fadeIn = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const fadeOut = interpolate(frame, [dur - 16, dur], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const logoSpring = spring({ frame, fps, config: { damping: 200, stiffness: 80 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.8, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const logoOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const taglineOpacity = interpolate(frame, [28, 46], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const taglineY = interpolate(frame, [28, 50], [16, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const badgeOpacity = interpolate(frame, [50, 66], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const auroraOpacity = interpolate(frame, [0, 40], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: BRAND.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      <Aurora opacity={auroraOpacity} />

      {/* Logo mark */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <Img
          src={staticFile('axiom-logo.png')}
          style={{ width: 72, height: 72, objectFit: 'contain' }}
        />
        <Img
          src={staticFile('axiom-text.png')}
          style={{ height: 44, objectFit: 'contain' }}
        />
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          marginTop: 36,
          fontFamily: dmSans,
          fontSize: 38,
          fontWeight: 600,
          color: BRAND.text,
          textAlign: 'center',
          letterSpacing: '-0.5px',
          lineHeight: 1.3,
          maxWidth: 840,
          padding: '0 60px',
        }}
      >
        Set-and-forget{' '}
        <span style={{ color: BRAND.accent }}>prediction market ETFs</span>
        {' '}on Solana
      </div>

      {/* Badge row */}
      <div
        style={{
          opacity: badgeOpacity,
          display: 'flex',
          gap: 12,
          marginTop: 32,
        }}
      >
        {['Powered by Jupiter', 'On-chain & transparent', 'Deposit USDC'].map((label) => (
          <span
            key={label}
            style={{
              fontFamily: dmSans,
              fontSize: 13,
              fontWeight: 500,
              color: BRAND.muted,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${BRAND.border}`,
              borderRadius: 99,
              padding: '6px 14px',
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene: Vaults ────────────────────────────────────────────────────────────
const SceneVaults: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = SCENES.VAULTS.end - SCENES.VAULTS.start;

  const fadeIn = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const fadeOut = interpolate(frame, [dur - 16, dur], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const labelOpacity = interpolate(frame, [4, 20], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const auroraOpacity = interpolate(frame, [0, 30], [0.4, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: BRAND.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 0,
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      <Aurora opacity={auroraOpacity} phase={200} />

      {/* Section label */}
      <div
        style={{
          opacity: labelOpacity,
          fontFamily: dmSans,
          fontSize: 13,
          fontWeight: 600,
          color: BRAND.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 24,
            height: 1,
            background: BRAND.muted,
            opacity: 0.5,
          }}
        />
        Choose your vault
        <div
          style={{
            width: 24,
            height: 1,
            background: BRAND.muted,
            opacity: 0.5,
          }}
        />
      </div>

      {/* Cards row */}
      <div style={{ display: 'flex', gap: 24 }}>
        {VAULTS.map((vault, i) => (
          <VaultCard
            key={vault.id}
            vault={vault}
            startFrame={0}
            delayFrames={i * 22}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene: CTA ───────────────────────────────────────────────────────────────
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const logoSpring = spring({ frame, fps, config: { damping: 200, stiffness: 80 } });
  const logoOpacity = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const logoScale = interpolate(logoSpring, [0, 1], [0.85, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const comingSoonOpacity = interpolate(frame, [20, 36], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const comingSoonY = interpolate(frame, [20, 40], [14, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const ctaOpacity = interpolate(frame, [38, 54], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const ctaY = interpolate(frame, [38, 56], [14, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const glowPulse = 0.6 + 0.4 * Math.sin((frame / fps) * Math.PI);
  const auroraOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: BRAND.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        opacity: fadeIn,
      }}
    >
      <Aurora opacity={auroraOpacity} phase={400} />

      {/* Glow orb */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(0, 229, 195, ${0.12 * glowPulse}) 0%, transparent 70%)`,
          filter: 'blur(60px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <Img
          src={staticFile('axiom-logo.png')}
          style={{ width: 56, height: 56, objectFit: 'contain' }}
        />
        <Img
          src={staticFile('axiom-text.png')}
          style={{ height: 34, objectFit: 'contain' }}
        />
      </div>

      {/* "Coming soon" */}
      <div
        style={{
          opacity: comingSoonOpacity,
          transform: `translateY(${comingSoonY}px)`,
          fontFamily: dmSans,
          fontSize: 64,
          fontWeight: 800,
          color: BRAND.text,
          letterSpacing: '-2px',
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        Coming soon.
      </div>

      {/* CTA line */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
          marginTop: 24,
          fontFamily: dmSans,
          fontSize: 28,
          fontWeight: 600,
          color: BRAND.accent,
          letterSpacing: '-0.3px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        Follow for launch
        <span style={{ fontSize: 24 }}>→</span>
      </div>

      {/* Divider + tagline */}
      <div
        style={{
          opacity: interpolate(frame, [52, 68], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }),
          marginTop: 40,
          fontFamily: dmSans,
          fontSize: 14,
          color: BRAND.muted,
          letterSpacing: '0.04em',
          textAlign: 'center',
        }}
      >
        Prediction market ETFs · Solana · Powered by Jupiter
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene transition: light flash ───────────────────────────────────────────
const TransitionFlash: React.FC<{ frame: number; peakFrame: number; duration?: number }> = ({
  frame,
  peakFrame,
  duration = 12,
}) => {
  const half = duration / 2;
  const opacity = interpolate(
    frame,
    [peakFrame - half, peakFrame, peakFrame + half],
    [0, 0.35, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp', easing: Easing.inOut(Easing.quad) }
  );
  return (
    <AbsoluteFill
      style={{
        background: 'white',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};

// ─── Root composition ─────────────────────────────────────────────────────────
export const TwitterClip: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: BRAND.bg, fontFamily: dmSans }}>
      {/* Scene 1: Hook */}
      <Sequence from={SCENES.HOOK.start} durationInFrames={SCENES.HOOK.end + 10}>
        <SceneHook />
      </Sequence>

      {/* Scene 2: Angle */}
      <Sequence from={SCENES.ANGLE.start} durationInFrames={SCENES.ANGLE.end - SCENES.ANGLE.start + 10}>
        <SceneAngle />
      </Sequence>

      {/* Scene 3: Solution */}
      <Sequence from={SCENES.SOLUTION.start} durationInFrames={SCENES.SOLUTION.end - SCENES.SOLUTION.start + 10}>
        <SceneSolution />
      </Sequence>

      {/* Scene 4: Vaults */}
      <Sequence from={SCENES.VAULTS.start} durationInFrames={SCENES.VAULTS.end - SCENES.VAULTS.start + 10}>
        <SceneVaults />
      </Sequence>

      {/* Scene 5: CTA */}
      <Sequence from={SCENES.CTA.start} durationInFrames={SCENES.CTA.end - SCENES.CTA.start}>
        <SceneCTA />
      </Sequence>

      {/* Transition flashes between scenes */}
      <TransitionFlash frame={frame} peakFrame={SCENES.SOLUTION.start} />
      <TransitionFlash frame={frame} peakFrame={SCENES.CTA.start} />
    </AbsoluteFill>
  );
};
