import './index.css';
import { Composition } from 'remotion';
import { TwitterClip } from './TwitterClip';
import { LandingHero } from './LandingHero';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 30s Twitter/X landscape clip */}
      <Composition
        id="TwitterClip"
        component={TwitterClip}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* 45s landing page hero (loops cleanly) */}
      <Composition
        id="LandingHero"
        component={LandingHero}
        durationInFrames={1350}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
