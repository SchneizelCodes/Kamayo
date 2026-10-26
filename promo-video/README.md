# Kamayo ad (promo video)

The 60-second vertical Kamayo ad, built with [Remotion](https://www.remotion.dev) in Kamayo's own design system. The full plan, scene list and asset checklist are in **PLAN.md**.

This folder is separate from the app. It has its own `package.json`, and the app's build and tests do not include it.

## Open in VS Code

1. In VS Code: **File → Open Folder…** and choose `Kamayo\promo-video`.
2. Open a terminal (**Terminal → New Terminal**) and install once:

```powershell
npm.cmd install
```

3. Start the studio. It opens in your browser with a timeline you can scrub, and updates live as you save files:

```powershell
npm.cmd run dev
```

## Render

```powershell
npm.cmd run render:draft   # half size, fast: out\kamayo-ad-draft.mp4
npm.cmd run render         # full 1080 x 1920: out\kamayo-ad.mp4
npm.cmd run still          # one frame (10 s) as a PNG: out\still.png
npm.cmd run typecheck
```

The first render downloads a headless Chrome for Remotion.

## Where to change things

| To change… | Edit |
|---|---|
| Timing of scenes, captions and motion beats | `src/timing.ts` |
| Footage, voiceover and music files | `src/assets.ts` (files go in `public/`) |
| Words shown inside the app screens | `src/content.ts` |
| Colors, fonts, motion springs | `src/theme.ts` (copied from the app's `src/styles.css`) |
| The travelling frame and the scene overlays | `src/KamayoAd.tsx` |
| App screens (home, lesson, quiz) | `src/components/AppScreens.tsx` |
| Learning path and camera pull-out | `src/components/PathMap.tsx` |
| Logo and Maya | `src/components/Brand.tsx` |
| Captions, cursor, headline motion | `src/components/Overlay.tsx` |

## Rules

- Never replace the footage placeholders with generated or animated hands. Every sign is filmed with a fluent FSL signer and approved by a Deaf FSL reviewer.
- Keep captions in their bottom band and keep graphics off the signers' faces and hands.
- Fonts (DM Sans, Manrope) are bundled in `public/fonts` under the SIL Open Font License.
