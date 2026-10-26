# Kamayo 60-second ad: production plan

Format: 9:16 vertical, 1080 × 1920, 30 fps, 60 s. Built in code with Remotion, in Kamayo's own design system (colors, fonts, logo, Maya and components copied from `../src/styles.css` and `../src/main.tsx`).

Status: **motion graphics built, footage and voiceover not yet recorded.** Every place that needs real media shows a labelled placeholder.

## The idea: "the frame that travels"

One rounded card carries the whole ad and never cuts. It starts as the signer's video, springs into the phone screen, becomes a lesson card, then a quiz card, then shrinks into Level 1 on the learning path. The only hard cut is at 49 s, from the app back to real life (two people signing). That footage frame then folds into the Kamayo logo.

The code for this is `TravellingFrame` in `src/KamayoAd.tsx`. `RECTS` says where the frame sits in each state, `MOVES` says when it moves, and `LAYERS` says what is inside it.

## Scene by scene

| Time | Scene | Frame becomes | What happens | Real media needed |
|---|---|---|---|---|
| 0–7 s | Hook | Full screen | Headline rises word by word above the signer's head | `hookSigner`: one signer greets the viewer |
| 7–15 s | Meet Kamayo | Phone screen | Logo drops in above; home screen sections rise in order | none (rebuilt from the app) |
| 15–26 s | Lessons | Lesson card | Card content swaps with a short blur: Greetings → Family → Essentials. Cursor taps Replay at 22.4 s and the playhead rewinds | `lessonClips` × 3 |
| 26–38 s | Challenges | Quiz card | Q1: watch a sign, tap the answer, green check. Q2: the real orientation question from `learning.ts` | `quizSignClip` + its correct answer in `content.ts` |
| 38–49 s | Progression | Level 1 node | "Lesson complete, +20 XP", card shrinks into the node, camera pulls out to the path, the line draws forward and Level 2 unlocks | none |
| 49–55 s | Real life | Full screen (hard cut) | Two people greet each other in FSL | `twoSigners` |
| 55–60 s | End card | Logo tile | Footage folds into the brand mark; wordmark, three tagline lines, Start Learning button | none |

## Design rules (from the Prompt Motion research)

- One continuous element; content swaps with a short blur instead of cuts.
- Springs with almost no overshoot. Only headlines get a tiny settle.
- No glows, particle bursts, gradients on UI or "template" effects. Warmth comes from Kamayo's palette, Maya and real people.
- One idea per shot. Every scene uses the same title rule: a mint label chip plus one Manrope headline.
- Pacing varies: quick in lessons and quiz, slow and wide in the path pull-out and the close.
- Real assets only. The app screens use Kamayo's own copy; nothing is invented.

## Accessibility rules (do not break these)

- Captions are always on, in a reserved band at the bottom (y 1690–1880). Nothing else goes there.
- Signers are framed above the caption band. The placeholders draw a gold box showing where the face, hands and upper body must stay.
- No graphic ever covers a signer's face or hands.
- **No generated, animated or traced hands.** Every sign is filmed with a fluent FSL signer, with permission, and approved by a Deaf FSL reviewer before release. This follows the Kamayo rule in `AGENTS.md`: agents must not make up how a sign is formed.
- Consider a signed version: either the presenter signs the script, or an FSL interpreter inset is added during the app scenes. Captions alone leave Deaf viewers without FSL in an FSL ad.

## Check before release: what the ad shows versus what the app has

The app today has only Level 1 (orientation) published. Levels 2–100 are "upcoming" until reviewed content exists (see `../README.md`). The ad shows video lessons, a sign-matching question and Level 2 unlocking. Before publishing, make sure these are live, or change the scenes to what is live, so the ad doesn't promise features learners can't use yet.

## Step-by-step to finish

1. **Lock the script.** Optional trim for the tight close: "Connect with Deaf friends, family, and community. Your first conversation begins with one sign. Kamayo — start learning, start signing, start connecting." If you change words, edit `captions` in `src/timing.ts`.
2. **Record the voiceover** (warm, relaxed, ~130 words per minute). Save as `public/audio/voiceover.mp3` and set `assets.voiceover`.
3. **Re-time to the voice.** Open the studio (`npm run dev`), scrub the timeline, and move the numbers in `src/timing.ts` (`captions` and `beats`) so each motion lands on its word.
4. **Film the signers** (9:16, 1080 × 1920 or larger, even soft light, plain warm background, no busy patterns). Shots: hook greeting; two-person greeting; three lesson demonstrations of ~3 s; one quiz sign. Keep the face, hands and upper body inside the gold box.
5. **Get FSL review** of every clip, and fill in the real options and answer for question 1 in `src/content.ts`.
6. **Add the files** to `public/footage/` and set their paths in `src/assets.ts`. Placeholders disappear automatically.
7. **Add music** (licensed for commercial use, soft acoustic or piano) as `public/audio/music.mp3`. It plays at 18% volume under the voice.
8. **Render** (`npm run render`) and review on a phone, with sound on and off.
9. **Deaf review of the final cut**, then fix and export.

## Asset checklist

- [x] Voiceover: `public/audio/line_{0..14}.mp3` (EmmaNeural +10% rate, +18Hz pitch)
- [x] Music: `public/audio/music.wav` (48kHz stereo gentle acoustic chord progression)
- [x] Hook signer: `public/footage/hook-signer.jpg`
- [x] Two signers: `public/footage/two-signers.jpg`
- [x] Lesson clips: `lesson-greetings.jpg`, `lesson-family.jpg`, `lesson-expressions.jpg`
- [x] Quiz sign clip + reviewed answer options: `quiz-sign.jpg`, options for "Thank you (Salamat)"
- [ ] Signer release forms (for final production actors)
- [ ] Deaf FSL reviewer sign-off on all clips and the final cut before public broadcast
