export type KamayoCue = 'select' | 'correct' | 'retry' | 'complete';

export const SOUND_STORAGE_KEY = 'kamayo-sound-v1';

const CUE_VOLUMES: Record<KamayoCue, number> = {
  select: 0.34,
  retry: 0.32,
  correct: 0.44,
  complete: 0.52,
};

const audioCache = new Map<KamayoCue, HTMLAudioElement>();
let lastPlayedAt = 0;

/** Parse persisted sound setting safely; gentle UI audio stays muted until opted in. */
export function parseSoundSetting(raw: string | null): boolean {
  return raw === 'on';
}

export function readSoundSetting(): boolean {
  try {
    return parseSoundSetting(localStorage.getItem(SOUND_STORAGE_KEY));
  } catch {
    return false;
  }
}

export function writeSoundSetting(enabled: boolean): void {
  if (!enabled) {
    for (const audio of audioCache.values()) {
      audio.pause();
      audio.currentTime = 0;
    }
    lastPlayedAt = 0;
  }
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // Storage may be blocked in strict privacy contexts.
  }
}

/** Play one crisp tactile cue when explicitly enabled by the learner. */
export function playCue(cue: KamayoCue, enabled: boolean): void {
  if (!enabled || typeof Audio === 'undefined') return;
  if (typeof document !== 'undefined' && document.hidden) return;
  const now = performance.now();
  if (now - lastPlayedAt < 55) return;
  lastPlayedAt = now;

  try {
    let audio = audioCache.get(cue);
    if (!audio) {
      audio = new Audio(`/sfx/${cue}.mp3`);
      audio.preload = 'auto';
      audioCache.set(cue, audio);
    }
    audio.volume = CUE_VOLUMES[cue];
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Autoplay policies may block playback outside direct gestures.
    });
  } catch {
    // Audio playback is strictly progressive enhancement.
  }
}
