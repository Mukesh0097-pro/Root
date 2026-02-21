import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import Hls from 'https://esm.sh/hls.js';
import { Play } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const VideoShowcase: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const src = "https://customer-hyt5dnmruhcgx46c.cloudflarestream.com/70400036b210ac75e75880f8b8b3c238/manifest/video.m3u8";

  useGSAP(() => {
    gsap.from(".video-card", {
      y: 60,
      opacity: 0,
      scale: 0.97,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 75%",
        toggleActions: "play none none reverse"
      }
    });
  }, { scope: containerRef });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        autoStartLoad: true,
        capLevelToPlayerSize: true
      });
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Video is ready to play
      });

      hls.on(Hls.Events.ERROR, (_event: unknown, data: { fatal?: boolean }) => {
        if (data.fatal) setVideoError(true);
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari which has native HLS support
      video.src = src;
    }
  }, [src]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Error playing video:", err);
      });
    }
  };

  return (
    <section ref={containerRef} className="w-full bg-root-bg py-24 relative border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl md:text-6xl font-medium text-white tracking-tight">
              System <span className="text-root-muted">Demo</span>
            </h2>
          </div>
          <div className="md:max-w-md text-root-muted text-lg">
            Experience the latency-free retrieval protocol in action across distributed nodes.
          </div>
        </div>

        <div className="video-card relative w-full aspect-[16/9] bg-[#0a0a0a] rounded-lg overflow-hidden border border-white/10 group shadow-2xl will-change-transform">
          {videoError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-root-card to-root-bg">
              <div className="w-16 h-16 rounded-full bg-root-accent/10 border border-root-accent/20 flex items-center justify-center text-root-accent mb-4">
                <Play size={24} />
              </div>
              <p className="text-white font-medium mb-1">Video unavailable</p>
              <p className="text-root-muted text-sm">Please try again later or contact us for a live demo.</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                controls={isPlaying}
                playsInline
                poster="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=3870&auto=format&fit=crop"
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onError={() => setVideoError(true)}
              />

              {!isPlaying && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors cursor-pointer z-10"
                  onClick={handlePlay}
                >
                  <div className="relative group/btn">
                    <div className="absolute -inset-4 bg-root-accent/20 rounded-full blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-root-accent hover:bg-white text-root-bg rounded-full flex items-center justify-center pl-1 transition-all duration-300 transform group-hover/btn:scale-105 shadow-xl">
                      <Play size={32} fill="currentColor" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};