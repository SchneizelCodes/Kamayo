import { useEffect, useRef, useState } from 'react';
import { Captions, Pause, Play, RefreshCw, Repeat, ShieldAlert, Video } from 'lucide-react';

export interface SignerPlayerShellProps {
  title: string;
  src?: string | null;
  poster?: string;
  captionsText?: string;
  framingNote?: string;
  isApprovedMedia?: boolean;
  onViewed?: () => void;
}

const SPEEDS = [0.5, 0.75, 1] as const;

/**
 * Signer-first visual media shell aligned with W3C player & sign-language guidance:
 * keeps signing space unobstructed, places written support below the frame, preserves
 * unmirrored orientation, and provides explicit upcoming/error recovery states.
 */
export function SignerPlayerShell({
  title,
  src = null,
  poster,
  captionsText,
  framingNote = 'Full upper body, face, and hands remain visible. Video stays unmirrored.',
  isApprovedMedia = false,
  onViewed,
}: SignerPlayerShellProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [loop, setLoop] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const playable = Boolean(isApprovedMedia && src && !mediaError);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      videoRef.current.loop = loop;
    }
  }, [speed, loop]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v || !playable) return;
    if (v.paused) {
      void v.play().then(() => onViewed?.()).catch(() => setMediaError(true));
    } else {
      v.pause();
    }
  };

  const replay = () => {
    const v = videoRef.current;
    if (!v || !playable) return;
    v.currentTime = 0;
    void v.play().catch(() => setMediaError(true));
  };

  return (
    <section className="signer-shell" aria-label={title}>
      <div className="signer-stage">
        {playable ? (
          <video
            ref={videoRef}
            src={src!}
            poster={poster}
            controls
            playsInline
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => {
              setPlaying(false);
              setMediaError(true);
            }}
          />
        ) : (
          <div className="signer-placeholder" role="status">
            <span className="signer-placeholder-icon" aria-hidden="true">
              {mediaError ? <ShieldAlert size={28} /> : <Video size={28} />}
            </span>
            <strong>
              {mediaError
                ? 'Demonstration media could not load'
                : 'Framing preview · awaiting fluent FSL media'}
            </strong>
            <p>
              {mediaError
                ? 'Check your connection or retry below. Lesson progress stays safe while video is unavailable.'
                : 'Keep the signer’s face, shoulders, and signing space clear. Controls and written notes sit below the frame, never over the hands.'}
            </p>
            {mediaError && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setMediaError(false)}
              >
                <RefreshCw size={15} />
                Retry video
              </button>
            )}
          </div>
        )}
      </div>

      <div className="signer-controls" role="toolbar" aria-label="Playback support controls">
        <button
          type="button"
          className="secondary-button"
          disabled={!playable}
          onClick={togglePlay}
          aria-pressed={playing}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
          <span>{playing ? 'Pause' : 'Play'}</span>
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={!playable}
          onClick={replay}
        >
          <RefreshCw size={15} />
          <span>Replay</span>
        </button>
        <div className="signer-speeds" role="group" aria-label="Playback speed">
          {SPEEDS.map((rate) => (
            <button
              key={rate}
              type="button"
              className={`signer-rate ${speed === rate ? 'selected' : ''}`}
              aria-pressed={speed === rate}
              onClick={() => setSpeed(rate)}
            >
              {rate}×
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`secondary-button ${loop ? 'selected' : ''}`}
          aria-pressed={loop}
          onClick={() => setLoop((v) => !v)}
        >
          <Repeat size={15} />
          <span>{loop ? 'Loop on' : 'Loop'}</span>
        </button>
        <button
          type="button"
          className={`secondary-button ${showCaptions ? 'selected' : ''}`}
          aria-pressed={showCaptions}
          onClick={() => setShowCaptions((v) => !v)}
        >
          <Captions size={15} />
          <span>{showCaptions ? 'Hide notes' : 'Show notes'}</span>
        </button>
      </div>

      {showCaptions && (
        <div className="signer-support-box">
          <p className="signer-framing-note">{framingNote}</p>
          {captionsText && <p className="signer-caption-text">{captionsText}</p>}
        </div>
      )}
    </section>
  );
}

