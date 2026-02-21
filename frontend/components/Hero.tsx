import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('.hero-text-line',
      { y: 100, opacity: 0, rotateX: -20 },
      { y: 0, opacity: 1, rotateX: 0, duration: 1.2, stagger: 0.15 }
    )
      .fromTo('.hero-sub',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 1 },
        "-=0.5"
      )
      .fromTo('.hero-btn',
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.7)" },
        "-=0.8"
      );

    // Parallax on scroll
    gsap.to(containerRef.current, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

  }, { scope: containerRef });

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
    if (videoRef.current) {
      gsap.fromTo(videoRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.2, ease: 'power2.inOut' }
      );
    }
  };

  return (
    <section ref={containerRef} className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-root-bg">

      {/* Thumbnail placeholder — visible until video loads */}
      <div
        className="absolute inset-0 z-10 bg-root-bg transition-opacity duration-700"
        style={{ opacity: videoLoaded ? 0 : 1 }}
      />

      {/* Video Background — clean, no blend mode */}
      <div className="absolute inset-0 z-10 will-change-transform">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onCanPlayThrough={handleVideoLoaded}
          className="w-full h-full object-cover opacity-0"
          src="/videos/Abstract_Dark_Teal_and_Lime_Loop.mp4"
        >
          <source src="/videos/Abstract_Dark_Teal_and_Lime_Loop.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Subtle bottom gradient for text readability */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-root-bg via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-root-bg to-transparent" />
      </div>

      {/* Content */}
      <div
        ref={textContainerRef}
        className="relative z-30 container mx-auto px-6 text-center max-w-6xl mt-10"
      >
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tighter mb-8 leading-tight drop-shadow-2xl perspective-1000">
          <div className="overflow-hidden inline-block"><span className="hero-text-line inline-block text-white">Federated</span></div>{' '}
          <div className="overflow-hidden inline-block"><span className="hero-text-line inline-block text-root-accent">Intelligence</span></div>
          <br />
          <div className="overflow-hidden inline-block"><span className="hero-text-line inline-block text-white">for</span></div>{' '}
          <div className="overflow-hidden inline-block"><span className="hero-text-line inline-block text-root-accent">the</span></div>{' '}
          <div className="overflow-hidden inline-block"><span className="hero-text-line inline-block text-root-accent">RAG</span></div>{' '}
          <div className="overflow-hidden inline-block"><span className="hero-text-line inline-block text-white">Era.</span></div>
        </h1>

        <div className="flex flex-col items-center">
          <p className="hero-sub text-lg md:text-xl text-root-muted max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Train on distributed private data without moving it.
          </p>

          <Link to="/contact" className="hero-btn bg-white text-black px-8 py-4 rounded-full font-bold tracking-wide hover:bg-root-accent transition-colors duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] inline-block">
            START BUILDING
          </Link>
        </div>
      </div>
    </section>
  );
};
