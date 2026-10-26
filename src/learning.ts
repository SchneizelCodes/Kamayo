export const stages = ['Beginner', 'Basic Communicator', 'Developing Communicator', 'Experienced Learner', 'Advanced Learner'];
export const units = ['A new way to connect', 'Everyday greetings', 'Polite exchanges', 'Your first conversations', 'Meet the family', 'People around us', 'Everyday essentials', 'Introducing yourself', 'Asking questions', 'Daily routines', 'Places and directions', 'Sharing your needs', 'Describing your world', 'Everyday situations', 'Longer exchanges', 'Making connections', 'Sharing ideas', 'Stories and experiences', 'Real-world conversations', 'Your next chapter'];
const first = ['Welcome to FSL', 'First greetings', 'Polite exchanges', 'Greetings in context', 'Your first checkpoint'];
export const levels = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, title: i < 5 ? first[i] : `${units[Math.floor(i / 5)]} · ${i % 5 + 1}`, unit: Math.floor(i / 5), stage: Math.floor(i / 20), checkpoint: (i + 1) % 5 === 0, stageCheck: (i + 1) % 20 === 0, published: i === 0, prerequisites: i ? [i] : [] }));
export type Progress = { completed: number[]; xp: number; goal: number; onboarding: boolean; completedAt: string | null; reviewAt: string | null };
export const initialProgress: Progress = { completed: [], xp: 0, goal: 20, onboarding: false, completedAt: null, reviewAt: null };
export function getLevelState(level: typeof levels[number], p: Progress) {
  if (!level.published) return 'upcoming';
  if (p.completed.includes(level.id)) return 'completed';
  return level.prerequisites.every(id => p.completed.includes(id)) ? 'available' : 'locked';
}
export function reviewDate(step: number, today = new Date().toISOString().slice(0, 10)) {
  const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + [1, 3, 7, 14][Math.min(Math.max(step, 0), 3)]); return d.toISOString().slice(0, 10);
}
export function completeOrientation(p: Progress): Progress {
  if (p.completed.includes(1)) return p;
  return { ...p, completed: [1], xp: 20, completedAt: new Date().toISOString(), reviewAt: reviewDate(0) };
}
export function restoreProgress(raw: string | null): Progress {
  try {
    const p = JSON.parse(raw || '{}');
    const completed = Array.isArray(p.completed) && p.completed.includes(1) ? [1] : [];
    return { ...initialProgress, completed, xp: completed.length * 20, goal: [10, 20, 30].includes(p.goal) ? p.goal : 20, onboarding: p.onboarding === true, completedAt: typeof p.completedAt === 'string' && !isNaN(Date.parse(p.completedAt)) ? p.completedAt : null, reviewAt: typeof p.reviewAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.reviewAt) ? p.reviewAt : null };
  } catch { return { ...initialProgress }; }
}
export const questions = [
  { title: 'A language of its own', text: 'Filipino Sign Language is a visual language used by the Filipino Deaf community. It has its own grammar and cultural context.', prompt: 'What is Filipino Sign Language?', options: ['A language with its own grammar', 'English expressed word for word', 'The same sign language everywhere'], answer: 0, explanation: 'FSL is a language in its own right. Learn its structures from fluent FSL signers rather than translating English word for word.' },
  { title: 'Look at the whole picture', text: 'When watching an FSL demonstration, keep the signer’s face, hands, and upper body in view. Facial expressions and body movements can carry meaning.', prompt: 'What should a clear demonstration show?', options: ['Only the hands', 'The face, hands, and upper body', 'Only a written translation'], answer: 1, explanation: 'Watch the whole signer. Facial expressions and body movements are part of signed communication.' },
  { title: 'Small steps, real connections', text: 'Replay demonstrations, take your time, and practice with educator-reviewed material. Finishing a course is a milestone; it does not automatically certify fluency.', prompt: 'What does completing Level 100 represent?', options: ['A professional interpreter qualification', 'Automatic fluency certification', 'Completion of Kamayo’s course'], answer: 2, explanation: 'Course completion is a meaningful milestone. Fluency requires broader communication experience and appropriate assessment.' },
];
