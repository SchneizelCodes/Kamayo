import asyncio
import os
import math
import numpy as np
import edge_tts
from scipy.io import wavfile

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "public", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

VOICE = "en-US-EmmaNeural"
RATE = "+10%"
PITCH = "+18Hz"

CAPTIONS = [
  (0.4, 3.4, "Want to learn Filipino Sign Language?"),
  (3.4, 6.8, "Imagine starting a conversation with just a simple sign."),
  (7.2, 10.6, "Meet Kamayo, your personal Filipino Sign Language tutor —"),
  (10.6, 14.8, "helping you learn step by step, at your own pace."),
  (15.2, 18.4, "Discover everyday greetings, signs for family members,"),
  (18.4, 21.4, "and useful expressions through clear video demonstrations."),
  (21.4, 25.8, "Watch closely, replay whenever you need, and practice along."),
  (26.2, 28.4, "Then, turn practice into progress!"),
  (28.4, 32.6, "Match signs with their meanings, answer interactive questions,"),
  (32.6, 37.8, "and revisit what you’ve learned to help each lesson stay with you."),
  (38.2, 41.8, "Begin with the basics and take on new challenges as you advance."),
  (41.8, 48.8, "Every completed lesson brings you another step closer to communicating with confidence."),
  (49.2, 52.6, "Learn to connect with Deaf friends, family, and your community."),
  (52.6, 55.4, "Your first conversation can begin with one sign."),
  (55.4, 59.6, "Kamayo — start learning, start signing, start connecting.")
]

async def synth_line(idx: int, text: str) -> str:
    path = os.path.join(AUDIO_DIR, f"line_{idx}.mp3")
    comm = edge_tts.Communicate(text, voice=VOICE, rate=RATE, pitch=PITCH)
    await comm.save(path)
    print(f"Generated line_{idx}.mp3: {os.path.getsize(path)} bytes")
    return path

async def generate_all_lines():
    print(f"Generating voice lines with voice {VOICE} ({RATE}, {PITCH})...")
    for i, (_, _, text) in enumerate(CAPTIONS):
        await synth_line(i, text)
    print("All voice lines generated!")

def generate_background_music():
    """Generates a warm, gentle, peaceful acoustic/marimba/electric piano chord progression
    at 48kHz for 60 seconds.
    """
    sample_rate = 48000
    total_seconds = 60.5
    total_samples = int(sample_rate * total_seconds)
    
    # We will synthesize in stereo float32
    audio = np.zeros((total_samples, 2), dtype=np.float32)
    
    # Chord progression in C Major / G Major:
    # C major (C4, E4, G4, B4) -> Am7 (A3, C4, E4, G4) -> Fmaj7 (F3, A3, C4, E4) -> Gsus4 to G (G3, C4, D4, G4)
    # 4 bars, ~8 seconds per loop
    chords = [
        [261.63, 329.63, 392.00, 493.88],  # Cmaj7
        [220.00, 261.63, 329.63, 392.00],  # Am7
        [174.61, 220.00, 261.63, 329.63],  # Fmaj7
        [196.00, 246.94, 293.66, 392.00],  # G
    ]
    chord_duration = 3.75  # ~120 bpm (2 bars per chord = 4s)
    
    # Generate warm bell/EP notes with rich harmonics and exponential decay
    t = np.arange(total_samples) / sample_rate
    
    beat_sec = 0.5  # 120 bpm eighth notes
    num_beats = int(total_seconds / beat_sec)
    
    for b in range(num_beats):
        beat_time = b * beat_sec
        chord_idx = int((beat_time / 4.0) % len(chords))
        chord = chords[chord_idx]
        
        # Pick note for this beat (arpeggio pattern)
        pattern = [0, 2, 1, 3, 2, 0, 1, 2]
        note_freq = chord[pattern[b % len(pattern)]]
        
        # Start sample
        s_start = int(beat_time * sample_rate)
        note_len = int(1.8 * sample_rate) # ring out
        s_end = min(total_samples, s_start + note_len)
        actual_len = s_end - s_start
        if actual_len <= 0:
            continue
            
        t_note = np.arange(actual_len) / sample_rate
        # Envelope: quick attack (5ms), exponential decay
        env = (1.0 - np.exp(-t_note / 0.008)) * np.exp(-t_note / 0.55)
        
        # Tone: fundamental + warm harmonics
        wave = (
            0.60 * np.sin(2 * np.pi * note_freq * t_note) +
            0.25 * np.sin(2 * np.pi * (note_freq * 2) * t_note) +
            0.10 * np.sin(2 * np.pi * (note_freq * 3) * t_note) +
            0.05 * np.sin(2 * np.pi * (note_freq * 4) * t_note)
        ) * env
        
        # Soft bass note on chord root on downbeats
        if b % 8 == 0:
            bass_freq = chord[0] / 2.0
            bass_env = (1.0 - np.exp(-t_note / 0.02)) * np.exp(-t_note / 1.8)
            bass_wave = (
                0.8 * np.sin(2 * np.pi * bass_freq * t_note) +
                0.3 * np.sin(2 * np.pi * bass_freq * 2 * t_note)
            ) * bass_env * 0.4
            wave += bass_wave
            
        # Panning (slight stereo spread)
        pan = 0.5 + 0.2 * np.sin(b * 1.3)
        audio[s_start:s_end, 0] += wave * (1.0 - pan) * 0.22
        audio[s_start:s_end, 1] += wave * pan * 0.22

    # Overall gentle fade-in (1.5s) and fade-out (3s)
    fade_in = np.clip(t / 1.5, 0, 1)
    fade_out = np.clip((total_seconds - t) / 3.0, 0, 1)
    gain = fade_in * fade_out
    audio[:, 0] *= gain
    audio[:, 1] *= gain

    # Normalize gently to -12 dB peak
    peak = np.max(np.abs(audio))
    if peak > 0:
        audio = (audio / peak) * 0.35
        
    int16_audio = (audio * 32767).astype(np.int16)
    out_wav = os.path.join(AUDIO_DIR, "music.wav")
    wavfile.write(out_wav, sample_rate, int16_audio)
    print(f"Generated music.wav ({len(int16_audio)/sample_rate:.1f}s, {os.path.getsize(out_wav)} bytes)")

if __name__ == "__main__":
    asyncio.run(generate_all_lines())
    generate_background_music()
