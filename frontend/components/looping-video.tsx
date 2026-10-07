'use client';

import { useEffect, useRef, useState } from 'react';

export function LoopingVideo({ src, poster, title }: { src: string; poster: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackPrompt, setPlaybackPrompt] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      if (entry.isIntersecting) {
        video.play().then(() => setPlaybackPrompt(false)).catch(() => setPlaybackPrompt(true));
      } else {
        video.pause();
      }
    }, { threshold: 0.25 });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="relative">
        <video ref={videoRef} className="aspect-video w-full bg-black object-contain" muted loop playsInline preload="none" poster={poster} aria-label={title}>
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
        </video>
        {playbackPrompt && (
          <button
            type="button"
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              video.play().then(() => setPlaybackPrompt(false)).catch(() => setPlaybackPrompt(true));
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/45 font-semibold text-white underline underline-offset-4"
          >
            Play advertisement
          </button>
        )}
      </div>
    </>
  );
}
