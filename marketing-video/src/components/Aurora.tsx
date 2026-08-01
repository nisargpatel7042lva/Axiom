import React from 'react';
import { useCurrentFrame } from 'remotion';

interface AuroraProps {
  opacity?: number;
  phase?: number;
}

export const Aurora: React.FC<AuroraProps> = ({ opacity = 1, phase = 0 }) => {
  const frame = useCurrentFrame();
  const t = (frame + phase) / 120;

  const x1 = 30 + Math.sin(t * 0.7) * 15;
  const y1 = 30 + Math.cos(t * 0.5) * 10;
  const x2 = 70 + Math.cos(t * 0.6) * 15;
  const y2 = 60 + Math.sin(t * 0.8) * 12;
  const x3 = 50 + Math.sin(t * 0.4) * 20;
  const y3 = 20 + Math.cos(t * 0.9) * 8;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Teal orb */}
      <div
        style={{
          position: 'absolute',
          width: '60%',
          height: '60%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0, 229, 195, 0.18) 0%, transparent 70%)',
          left: `${x1}%`,
          top: `${y1}%`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(60px)',
        }}
      />
      {/* Violet orb */}
      <div
        style={{
          position: 'absolute',
          width: '55%',
          height: '55%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.14) 0%, transparent 70%)',
          left: `${x2}%`,
          top: `${y2}%`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(80px)',
        }}
      />
      {/* Indigo orb */}
      <div
        style={{
          position: 'absolute',
          width: '50%',
          height: '50%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
          left: `${x3}%`,
          top: `${y3}%`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(70px)',
        }}
      />
    </div>
  );
};
