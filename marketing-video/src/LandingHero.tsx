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
import { Wallet, Cpu, TrendingUp, ArrowRight } from 'lucide-react';
import { Aurora } from './components/Aurora';
import { VaultCard } from './components/VaultCard';
import { BRAND, VAULTS, SCENES_HERO } from './constants';

const { fontFamily: dmSans } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
});
const { fontFamily: spaceMono } = loadSpaceMono('normal', {
  weights: ['400', '700'],
});

// ─── Scene: Hook (120f = 4s) ──────────────────────────────────────────────────
const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES_HERO.HOOK.end - SCENES_HERO.HOOK.start;

  const metricSpring = spring({ frame, fps, config: { damping: 200, stiffness: 90 } });
  const metricTranslate = interpolate(metricSpring, [0, 1], [80, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const metricOpacity = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const subOpacity = interpolate(frame, [22, 40], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const subY = interpolate(frame, [22, 44], [20, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const glowPulse = 0.7 + 0.3 * Math.sin((frame / fps) * Math.PI * 1.2);
  const fadeOut = interpolate(frame, [dur - 14, dur], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

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
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(0, 229, 195, ${0.18 * glowPulse}) 0%, transparent 65%)`,
          filter: 'blur(100px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

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
            fontSize: 160,
            fontWeight: 800,
            color: BRAND.text,
            lineHeight: 0.85,
            letterSpacing: '-6px',
          }}
        >
          up to <span style={{ color: BRAND.accent }}>28%</span>
        </div>
        <div
          style={{
            fontFamily: spaceMono,
            fontSize: 64,
            fontWeight: 700,
            color: BRAND.text,
            letterSpacing: '-1px',
            marginTop: 16,
          }}
        >
          APY
        </div>
      </div>

      <div
        style={{
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          marginTop: 36,
          fontFamily: dmSans,
          fontSize: 30,
          color: BRAND.muted,
          fontWeight: 400,
          letterSpacing: '0.01em',
        }}
      >
        from prediction markets · on Solana
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene: Angle (210f = 7s) ─────────────────────────────────────────────────
const SceneAngle: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = SCENES_HERO.ANGLE.end - SCENES_HERO.ANGLE.start;

  const lines = [
    { text: 'Your stablecoin yield is stagnant.', delay: 10 },
    { text: 'Prediction markets price real-world events in real-time.', delay: 48 },
    { text: 'Your USDC can trade them — automatically.', delay: 90, accent: true },
  ];

  const fadeIn = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const fadeOut = interpolate(frame, [dur - 16, dur], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: BRAND.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 960, padding: '0 80px' }}>
        {lines.map(({ text, delay, accent }, i) => {
          const op = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          const y = interpolate(frame, [delay, delay + 28], [24, 0], {
            extrapolateRight: 'clamp',
            extrapolateLeft: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          return (
            <div
              key={i}
              style={{
                opacity: op,
                transform: `translateY(${y}px)`,
                fontFamily: dmSans,
                fontSize: 50,
                fontWeight: accent ? 700 : 400,
                color: accent ? BRAND.text : BRAND.muted,
                lineHeight: 1.25,
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

// ─── Scene: Solution (240f = 8s) ──────────────────────────────────────────────
const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES_HERO.SOLUTION.end - SCENES_HERO.SOLUTION.start;

  const fadeIn = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const fadeOut = interpolate(frame, [dur - 16, dur], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const logoSpring = spring({ frame, fps, config: { damping: 200, stiffness: 70 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.75, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const taglineOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const taglineY = interpolate(frame, [30, 54], [20, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const badgeOpacity = interpolate(frame, [55, 72], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const auroraOpacity = interpolate(frame, [0, 50], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

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

      <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})`, display: 'flex', alignItems: 'center', gap: 20 }}>
        <Img src={staticFile('axiom-logo.png')} style={{ width: 80, height: 80, objectFit: 'contain' }} />
        <Img src={staticFile('axiom-text.png')} style={{ height: 50, objectFit: 'contain' }} />
      </div>

      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          marginTop: 40,
          fontFamily: dmSans,
          fontSize: 44,
          fontWeight: 600,
          color: BRAND.text,
          textAlign: 'center',
          letterSpacing: '-0.5px',
          lineHeight: 1.3,
          maxWidth: 880,
          padding: '0 60px',
        }}
      >
        Set-and-forget{' '}
        <span style={{ color: BRAND.accent }}>prediction market ETFs</span>
        {' '}on Solana
      </div>

      <div style={{ opacity: badgeOpacity, display: 'flex', gap: 12, marginTop: 36 }}>
        {['Powered by Jupiter', 'On-chain & transparent', 'Deposit USDC'].map((label) => (
          <span
            key={label}
            style={{
              fontFamily: dmSans,
              fontSize: 14,
              fontWeight: 500,
              color: BRAND.muted,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${BRAND.border}`,
              borderRadius: 99,
              padding: '7px 16px',
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene: How It Works (270f = 9s) ──────────────────────────────────────────
const STEPS = [
  {
    icon: Wallet,
    title: 'Deposit USDC',
    body: 'Connect your Solana wallet and deposit USDC into your chosen vault.',
    color: BRAND.accent,
    delay: 10,
  },
  {
    icon: Cpu,
    title: 'Engine trades for you',
    body: 'The strategy engine scans prediction markets and executes positions automatically.',
    color: '#8b5cf6',
    delay: 50,
  },
  {
    icon: TrendingUp,
    title: 'Earn yield',
    body: 'Idle capital earns lending yield via Jupiter. Winning predictions compound your returns.',
    color: '#f59e0b',
    delay: 90,
  },
];

const SceneHowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = SCENES_HERO.HOWITWORKS.end - SCENES_HERO.HOWITWORKS.start;
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const fadeOut = interpolate(frame, [dur - 16, dur], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const labelOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

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
      <Aurora opacity={0.6} phase={100} />

      <div
        style={{
          opacity: labelOpacity,
          fontFamily: dmSans,
          fontSize: 13,
          fontWeight: 600,
          color: BRAND.muted,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.12em',
          marginBottom: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ width: 28, height: 1, background: BRAND.muted, opacity: 0.4 }} />
        How it works
        <div style={{ width: 28, height: 1, background: BRAND.muted, opacity: 0.4 }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        {STEPS.map(({ icon: Icon, title, body, color, delay }, i) => {
          const stepSpring = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 200, stiffness: 100 } });
          const stepOpacity = interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          const stepY = interpolate(stepSpring, [0, 1], [40, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

          return (
            <React.Fragment key={i}>
              <div
                style={{
                  opacity: stepOpacity,
                  transform: `translateY(${stepY}px)`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 280,
                  padding: '0 20px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    background: `${color}18`,
                    border: `1px solid ${color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color,
                    marginBottom: 20,
                  }}
                >
                  <Icon size={28} strokeWidth={1.6} />
                </div>
                <div
                  style={{
                    fontFamily: dmSans,
                    fontSize: 20,
                    fontWeight: 700,
                    color: BRAND.text,
                    marginBottom: 10,
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontFamily: dmSans,
                    fontSize: 15,
                    color: BRAND.muted,
                    lineHeight: 1.6,
                  }}
                >
                  {body}
                </div>
              </div>

              {/* Arrow connector */}
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    opacity: interpolate(frame, [delay + 30, delay + 46], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }),
                    display: 'flex',
                    alignItems: 'center',
                    color: BRAND.border,
                    paddingTop: 36,
                  }}
                >
                  <ArrowRight size={24} strokeWidth={1.5} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene: Vaults (360f = 12s) ───────────────────────────────────────────────
const SceneVaults: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = SCENES_HERO.VAULTS.end - SCENES_HERO.VAULTS.start;

  const fadeIn = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const fadeOut = interpolate(frame, [dur - 16, dur], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const labelOpacity = interpolate(frame, [4, 22], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

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
      <Aurora opacity={1} phase={300} />

      <div
        style={{
          opacity: labelOpacity,
          fontFamily: dmSans,
          fontSize: 13,
          fontWeight: 600,
          color: BRAND.muted,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.12em',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ width: 28, height: 1, background: BRAND.muted, opacity: 0.4 }} />
        Choose your vault
        <div style={{ width: 28, height: 1, background: BRAND.muted, opacity: 0.4 }} />
      </div>

      <div style={{ display: 'flex', gap: 28 }}>
        {VAULTS.map((vault, i) => (
          <VaultCard
            key={vault.id}
            vault={vault}
            startFrame={0}
            delayFrames={i * 26}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene: CTA (150f = 5s) ───────────────────────────────────────────────────
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const logoOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const logoSpring = spring({ frame, fps, config: { damping: 200, stiffness: 70 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.82, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const comingOpacity = interpolate(frame, [22, 40], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const comingY = interpolate(frame, [22, 42], [16, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const ctaOpacity = interpolate(frame, [42, 60], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const glowPulse = 0.6 + 0.4 * Math.sin((frame / fps) * Math.PI * 0.9);
  const auroraOpacity = interpolate(frame, [0, 36], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

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
      <Aurora opacity={auroraOpacity} phase={500} />

      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 350,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(0, 229, 195, ${0.14 * glowPulse}) 0%, transparent 70%)`,
          filter: 'blur(70px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})`, display: 'flex', alignItems: 'center', gap: 18, marginBottom: 36 }}>
        <Img src={staticFile('axiom-logo.png')} style={{ width: 64, height: 64, objectFit: 'contain' }} />
        <Img src={staticFile('axiom-text.png')} style={{ height: 40, objectFit: 'contain' }} />
      </div>

      <div
        style={{
          opacity: comingOpacity,
          transform: `translateY(${comingY}px)`,
          fontFamily: dmSans,
          fontSize: 72,
          fontWeight: 800,
          color: BRAND.text,
          letterSpacing: '-2.5px',
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        Coming soon.
      </div>

      <div
        style={{
          opacity: ctaOpacity,
          marginTop: 28,
          fontFamily: dmSans,
          fontSize: 30,
          fontWeight: 600,
          color: BRAND.accent,
          letterSpacing: '-0.3px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        Follow for launch <span style={{ fontSize: 26 }}>→</span>
      </div>

      <div
        style={{
          opacity: interpolate(frame, [60, 76], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }),
          marginTop: 44,
          fontFamily: dmSans,
          fontSize: 14,
          color: BRAND.muted,
          letterSpacing: '0.04em',
        }}
      >
        Prediction market ETFs · Solana · Powered by Jupiter
      </div>
    </AbsoluteFill>
  );
};

// ─── Flash overlay ────────────────────────────────────────────────────────────
const Flash: React.FC<{ peakFrame: number }> = ({ peakFrame }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [peakFrame - 8, peakFrame, peakFrame + 8],
    [0, 0.3, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp', easing: Easing.inOut(Easing.quad) }
  );
  return <AbsoluteFill style={{ background: 'white', opacity, pointerEvents: 'none' }} />;
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export const LandingHero: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BRAND.bg, fontFamily: dmSans }}>
      <Sequence from={SCENES_HERO.HOOK.start} durationInFrames={SCENES_HERO.HOOK.end + 14}>
        <SceneHook />
      </Sequence>
      <Sequence from={SCENES_HERO.ANGLE.start} durationInFrames={SCENES_HERO.ANGLE.end - SCENES_HERO.ANGLE.start + 14}>
        <SceneAngle />
      </Sequence>
      <Sequence from={SCENES_HERO.SOLUTION.start} durationInFrames={SCENES_HERO.SOLUTION.end - SCENES_HERO.SOLUTION.start + 14}>
        <SceneSolution />
      </Sequence>
      <Sequence from={SCENES_HERO.HOWITWORKS.start} durationInFrames={SCENES_HERO.HOWITWORKS.end - SCENES_HERO.HOWITWORKS.start + 14}>
        <SceneHowItWorks />
      </Sequence>
      <Sequence from={SCENES_HERO.VAULTS.start} durationInFrames={SCENES_HERO.VAULTS.end - SCENES_HERO.VAULTS.start + 14}>
        <SceneVaults />
      </Sequence>
      <Sequence from={SCENES_HERO.CTA.start} durationInFrames={SCENES_HERO.CTA.end - SCENES_HERO.CTA.start}>
        <SceneCTA />
      </Sequence>

      <Flash peakFrame={SCENES_HERO.SOLUTION.start} />
      <Flash peakFrame={SCENES_HERO.HOWITWORKS.start} />
      <Flash peakFrame={SCENES_HERO.CTA.start} />
    </AbsoluteFill>
  );
};
