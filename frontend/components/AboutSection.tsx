import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const IMAGES = [
  "/images/Gemini_Generated_Image_2y1cek2y1cek2y1c.png",
  "/images/Gemini_Generated_Image_cgdre2cgdre2cgdr.png",
  "/images/Gemini_Generated_Image_lfrdillfrdillfrd.png",
  "/images/Gemini_Generated_Image_qsli01qsli01qsli.png",
  "/images/Gemini_Generated_Image_vgqrckvgqrckvgqr.png",
  "/images/Gemini_Generated_Image_xfjbgkxfjbgkxfjb.png"
];

const LABELS = ["AI", "DATA", "SECURE"];

const CARDS = [
  { id: 1, label: "AI" },
  { id: 2, label: "DATA" },
  { id: 3, label: "SECURE" }
];

export const AboutSection: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [imageIndices, setImageIndices] = useState([0, 1, 2]);

  // Loop through images for each card
  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndices(prev => prev.map((idx, i) => (idx + 1) % IMAGES.length));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useGSAP(() => {
    // Text reveal animation with stagger
    gsap.fromTo(".about-text",
      { y: 50, opacity: 0, filter: "blur(4px)" },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 1.1,
        stagger: 0.18,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          toggleActions: "play none none none"
        }
      }
    );

    // Cards reveal with rotation and scale
    const cards = gsap.utils.toArray(".about-card") as HTMLElement[];
    cards.forEach((card, index) => {
      const rotation = index === 0 ? -2 : index === 1 ? 3 : -4;

      gsap.fromTo(card,
        {
          y: 100 + (index * 30),
          opacity: 0,
          scale: 0.85,
          rotation: rotation - 10,
          filter: "blur(8px)"
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotation: rotation,
          filter: "blur(0px)",
          duration: 1.2,
          delay: 0.15 * index,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
            toggleActions: "play none none none"
          }
        }
      );
    });

    // Floating UI element animation
    gsap.fromTo(".about-ui",
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay: 0.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
          toggleActions: "play none none none"
        }
      }
    );

    // Subtle float animation for cards on scroll
    if (cardsRef.current) {
      gsap.to(cardsRef.current, {
        yPercent: -6,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5
        }
      });
    }
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-32 bg-root-bg relative overflow-hidden border-t border-white/10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Left: Text Content */}
          <div className="order-2 lg:order-1">
            <h2 className="about-text text-4xl md:text-5xl lg:text-6xl font-medium text-white mb-8 leading-[1.1]">
              We help humans solve creative problems with AI.
            </h2>
            <p className="about-text text-lg md:text-xl text-white/70 leading-relaxed mb-6">
              Root partners with startups to transform vision into reality. Combining deep creative and AI expertise to build faster, smarter, and with more impact.
            </p>
          </div>

          {/* Right: Card Stack Visual */}
          <div ref={cardsRef} className="order-1 lg:order-2 relative h-[500px] md:h-[600px] perspective-1000">

            {/* Stacked cards */}
            {CARDS.map((card, index) => (
              <div
                key={card.id}
                className="about-card absolute rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                style={{
                  width: index === 0 ? '70%' : index === 1 ? '55%' : '50%',
                  height: index === 0 ? '65%' : index === 1 ? '45%' : '40%',
                  top: index === 0 ? '5%' : index === 1 ? '45%' : '50%',
                  left: index === 0 ? '15%' : index === 1 ? '0%' : '45%',
                  zIndex: 3 - index,
                  transform: `rotate(${index === 0 ? '-2deg' : index === 1 ? '3deg' : '-4deg'})`
                }}
              >
                {/* Image with crossfade transition */}
                <div className="relative w-full h-full">
                  {IMAGES.map((img, imgIndex) => (
                    <img
                      key={imgIndex}
                      src={img}
                      alt={`${card.label} - Root platform visual`}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${imageIndices[index] === imgIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 text-white font-mono text-sm tracking-wider opacity-80">
                  {card.label}
                </div>
              </div>
            ))}

            {/* Floating UI element */}
            <div className="about-ui absolute bottom-4 left-0 right-0 flex justify-between items-end px-4 z-10">
              <div className="bg-black/60 backdrop-blur-md rounded-lg px-4 py-2 border border-white/10">
                <div className="text-white/50 text-xs font-mono uppercase tracking-wider">SAMPLER</div>
                <div className="text-white text-2xl font-bold font-mono">49:56</div>
              </div>
              <div className="flex gap-2">
                <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-white/20"></div>
                </div>
                <div className="w-12 h-12 rounded-full bg-root-accent/80 backdrop-blur-md border border-root-accent flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-root-bg"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
