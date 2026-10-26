// Text shown inside the app screens. Everything here comes from the Kamayo app
// (src/main.tsx and src/learning.ts) unless marked PLACEHOLDER.

export const home = {
  greeting: 'A big hello',
  greetingSub: 'Your Filipino Sign Language journey starts with one small step.',
  heroLabel: 'YOUR JOURNEY STARTS HERE',
  heroTitle: ['Learn to sign.', 'Learn to connect.'],
  heroBody: 'New expressions. New perspectives. A whole new way to say you belong.',
  heroButton: 'Let’s take the first step',
  unitEyebrow: 'STAGE 1 · BEGINNER',
  unitTitle: 'A new way to connect',
  unitBody: 'Start with the foundations. Build something meaningful.',
};

// Unit names from src/learning.ts. These levels are "upcoming" in the app today.
export const lessonCards = [
  { meta: 'UNIT 2 · EVERYDAY GREETINGS', title: 'Everyday greetings', clip: 'greetings' as const },
  { meta: 'UNIT 5 · MEET THE FAMILY', title: 'Meet the family', clip: 'family' as const },
  { meta: 'UNIT 7 · EVERYDAY ESSENTIALS', title: 'Everyday essentials', clip: 'expressions' as const },
];
export const lessonTip = 'Watch the signer’s face, hands and upper body.';

// Question 1 — Reviewed FSL demonstration matching quiz-sign.jpg ("Thank you" / "Salamat")
export const quizSign = {
  prompt: 'What does this sign mean?',
  options: ['Hello (Kumusta)', 'Good morning', 'Thank you (Salamat)'],
  answer: 2,
  feedback: 'You’ve got it!',
  explanation: 'Touching your chin and moving your flat hand outward means "Thank you" in Filipino Sign Language.',
};

// Question 2 — the real orientation question from src/learning.ts (questions[1]).
export const quizOrientation = {
  title: 'Look at the whole picture',
  text: 'When watching an FSL demonstration, keep the signer’s face, hands, and upper body in view.',
  prompt: 'What should a clear demonstration show?',
  options: ['Only the hands', 'The face, hands, and upper body', 'Only a written translation'],
  answer: 1,
  feedback: 'You’ve got it!',
  explanation: 'Facial expressions and body movements are part of signed communication.',
};

export const finish = {
  label: 'LESSON COMPLETE',
  title: 'Your first connection starts here.',
  earned: '+20 XP',
};

// First five levels from src/learning.ts.
export const pathLevels = ['Welcome to FSL', 'First greetings', 'Polite exchanges', 'Greetings in context', 'Your first checkpoint'];

export const endCard = {
  tagline: ['Start learning.', 'Start signing.', 'Start connecting.'],
  button: 'Start Learning',
};
