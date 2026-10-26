// One place for every time in the ad. Edit seconds here; scenes read from it.
// Caption times are estimates. Re-time them to the recorded voiceover (see PLAN.md, step 3).

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION_S = 60;

export const sec = (s: number) => Math.round(s * FPS);

export const scenes = {
  hook: { from: 0, to: 7 },
  intro: { from: 7, to: 15 },
  lessons: { from: 15, to: 26 },
  challenge: { from: 26, to: 38 },
  progression: { from: 38, to: 49 },
  close: { from: 49, to: 60 },
} as const;

export type SceneName = keyof typeof scenes;

// Voiceover, split into caption-sized phrases (two lines max at 54 px).
export const captions: { from: number; to: number; text: string }[] = [
  { from: 0.4, to: 3.4, text: 'Want to learn Filipino Sign Language?' },
  { from: 3.4, to: 6.8, text: 'Imagine starting a conversation with just a simple sign.' },

  { from: 7.2, to: 10.6, text: 'Meet Kamayo, your personal Filipino Sign Language tutor —' },
  { from: 10.6, to: 14.8, text: 'helping you learn step by step, at your own pace.' },

  { from: 15.2, to: 18.4, text: 'Discover everyday greetings, signs for family members,' },
  { from: 18.4, to: 21.4, text: 'and useful expressions through clear video demonstrations.' },
  { from: 21.4, to: 25.8, text: 'Watch closely, replay whenever you need, and practice along.' },

  { from: 26.2, to: 28.4, text: 'Then, turn practice into progress!' },
  { from: 28.4, to: 32.6, text: 'Match signs with their meanings, answer interactive questions,' },
  { from: 32.6, to: 37.8, text: 'and revisit what you’ve learned to help each lesson stay with you.' },

  { from: 38.2, to: 41.8, text: 'Begin with the basics and take on new challenges as you advance.' },
  { from: 41.8, to: 48.8, text: 'Every completed lesson brings you another step closer to communicating with confidence.' },

  { from: 49.2, to: 52.6, text: 'Learn to connect with Deaf friends, family, and your community.' },
  { from: 52.6, to: 55.4, text: 'Your first conversation can begin with one sign.' },
  { from: 55.4, to: 59.6, text: 'Kamayo — start learning, start signing, start connecting.' },
];

// Moments the motion is synced to. Move these when the voiceover is recorded.
export const beats = {
  hookHeadlineIn: 0.4,
  meetKamayo: 7.2, // frame springs into the phone
  lessonCards: [15.2, 17.4, 19.6], // greetings, family, expressions
  replayTap: 22.4, // "replay whenever you need"
  quizAppear: 26.2,
  quizTap1: 30.0,
  quizCheck1: 30.6,
  quizSwap: 33.4,
  quizTap2: 35.2,
  quizCheck2: 35.8,
  lessonComplete: 38.2,
  pullOut: 40.0,
  unlock: 43.5,
  twoSignersCut: 49.0, // the only hard cut in the ad
  endCard: 54.8,
  tagline: [55.4, 56.6, 57.8],
};
