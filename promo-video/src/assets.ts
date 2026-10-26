// Real media goes here. Until a file is added, the ad shows a labelled placeholder
// in its place, so the timing and layout can be reviewed before filming.
//
// 1. Put the file in public/ (for example public/footage/hook-signer.mp4).
// 2. Replace null with the path relative to public/ (for example 'footage/hook-signer.mp4').
//
// Every sign shown must be performed by a fluent FSL signer and approved by a Deaf FSL
// reviewer, with the signer's permission. Never replace these with generated or animated hands.

export const assets: {
  hookSigner: string | null;
  twoSigners: string | null;
  lessonClips: { greetings: string | null; family: string | null; expressions: string | null };
  quizSignClip: string | null;
  voiceover: string | null;
  music: string | null;
} = {
  // 0-7s: one signer greets the viewer, medium shot, face and hands in frame. 9:16, 1080x1920.
  hookSigner: 'footage/hook-signer.jpg',
  // 49-54.8s: two people greet each other in FSL, three-quarter angle. 9:16, 1080x1920.
  twoSigners: 'footage/two-signers.jpg',
  // 15-26s: approved Kamayo lesson demonstrations, ~3 s each. Shown inside the app card.
  lessonClips: {
    greetings: 'footage/lesson-greetings.jpg',
    family: 'footage/lesson-family.jpg',
    expressions: 'footage/lesson-expressions.jpg',
  },
  // 26-38s: the sign the learner watches before answering.
  quizSignClip: 'footage/quiz-sign.jpg',
  // Voiceover audio track
  voiceover: 'audio/line_0.mp3',
  // Music bed mixed softly under voiceover.
  music: 'audio/music.wav',
};
