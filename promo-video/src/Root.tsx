import React from 'react';
import { Composition } from 'remotion';
import { KamayoAd } from './KamayoAd';
import { DURATION_S, FPS, HEIGHT, WIDTH } from './timing';

export const RemotionRoot: React.FC = () => (
  <Composition id="KamayoAd" component={KamayoAd} durationInFrames={DURATION_S * FPS} fps={FPS} width={WIDTH} height={HEIGHT} />
);
