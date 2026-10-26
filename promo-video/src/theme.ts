// Kamayo design tokens, copied from ../src/styles.css (the app's design system).
// If the app's colors or fonts change, update them here so the ad keeps matching.
import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// The same fonts as the app (DM Sans for text, Manrope for headings), bundled in public/fonts
// so renders work offline and never wait on Google Fonts. Both are SIL Open Font License.
const faces: [string, string][] = [
  ['DM Sans', '400'], ['DM Sans', '500'], ['DM Sans', '600'], ['DM Sans', '700'],
  ['Manrope', '500'], ['Manrope', '700'], ['Manrope', '800'],
];
for (const [family, weight] of faces) {
  const file = `${family.toLowerCase().replace(' ', '-')}-latin-${weight}-normal.woff2`;
  loadFont({ family, url: staticFile(`fonts/${file}`), weight, format: 'woff2' });
}

export const fonts = {
  body: "'DM Sans', sans-serif", // :root font-family
  heading: "'Manrope', sans-serif", // h1, h2, h3, .brand
};

export const color = {
  // :root tokens
  bg: '#fafbf8',
  surface: '#ffffff',
  text: '#263e36',
  muted: '#7b8982',
  line: '#e7ece6',
  green: '#167967',
  mint: '#eaf3eb',
  cream: '#f7f3e9',
  // Component colors used across the app
  gold: '#e9b75c', // .brand-dot
  sun: '#efbe64', // sprout sparkles
  heroBg: '#e5eee2', // .hero-card
  heroBorder: '#dfe8dc',
  heroHeading: '#284c3b',
  heroBody: '#71846f',
  darkButton: '#254d3c', // .dark-button
  nodeReady: '#187b65', // .level-node.ready
  nodeReadyShadow: '#115f4f',
  nodeIdle: '#eaf0e7', // .level-node
  nodeIdleText: '#b3c0aa',
  nodeIdleShadow: '#d8e1d1',
  dashed: '#dce5d9', // .mini-path:before
  progress: '#7da77a', // .progress-track > span
  correctBorder: '#7fa975', // .answer-options .correct
  correctBg: '#edf5e9',
  successText: '#597d50', // .answer-feedback.success
  successBg: '#eaf3e5',
  selectedBorder: '#72a894',
  earnedText: '#aa9757', // .earned
  earnedBg: '#faf3da',
  eyebrow: '#829286',
  labelText: '#6b8673',
  tagBg: '#fffdf3', // .floating-tag
  orbit: '#b6c8a9',
  star: '#d5b76e',
  focus: '#339e8d',
};

// The ad is 1080 px wide; the app's CSS sizes were written for ~360-1440 px screens.
// Multiply app pixel values by this so components keep their proportions on a 1080x1920 canvas.
export const S = 2.6;

export const radius = {
  card: 20 * S * 0.6,
  button: 10 * S,
  option: 11 * S,
};

// Motion rules (from the gallery research): springs with almost no overshoot,
// no glows, no particle bursts, no gradients on UI.
export const spring = {
  calm: { damping: 200, mass: 1, stiffness: 120 }, // no overshoot
  settle: { damping: 18, mass: 0.9, stiffness: 140 }, // tiny overshoot, for headlines
};
