import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useIsMobile } from '../hooks/useAnimations';

gsap.registerPlugin(ScrollTrigger);

export const ValueProp: React.FC = () => {
  const container = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: "top 80%",
        end: "bottom 60%",
        toggleActions: "play none none reverse"
      }
    });

    // Animate Text Elements (staggered)
    tl.fromTo(".vp-anim-text",
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" }
    );

    // Animate Image Scale & Opacity
    gsap.fromTo(imageRef.current,
      { scale: 0.9, opacity: 0, filter: "blur(10px)" },
      {
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: container.current,
          start: "top 70%",
        }
      }
    );

    // Subtle parallax on the visual card
    if (imageRef.current) {
      gsap.to(imageRef.current, {
        yPercent: -6,
        ease: "none",
        scrollTrigger: {
          trigger: container.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      });
    }

    // Animate the UI Overlay inside the image separately
    gsap.fromTo(".vp-ui-overlay",
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay: 0.5,
        scrollTrigger: {
          trigger: container.current,
          start: "top 60%",
        }
      }
    );

  }, { scope: container });

  const handleTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !imageRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(imageRef.current, {
      rotateY: x * 8,
      rotateX: -y * 8,
      duration: 0.4,
      ease: "power3.out",
      transformPerspective: 1000,
      transformOrigin: "center"
    });
  };

  const resetTilt = () => {
    if (isMobile || !imageRef.current) return;
    gsap.to(imageRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.6,
      ease: "power3.out"
    });
  };

  return (
    <section ref={container} id="solutions" className="py-24 bg-root-bg relative overflow-hidden">
      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Text Content */}
        <div className="order-2 lg:order-1">
          <h2 className="vp-anim-text text-4xl md:text-6xl font-medium text-white mb-8 leading-tight">
            We help enterprises solve <br />
            <span className="text-root-muted">data silos with Federated AI.</span>
          </h2>
          <p className="vp-anim-text text-lg text-root-muted mb-6 leading-relaxed">
            Root partners with regulated industries to transform dormant data into active intelligence.
          </p>
          <p className="vp-anim-text text-lg text-root-muted mb-8 leading-relaxed">
            By combining secure multi-party computation with RAG, we allow you to query across boundaries without compromising privacy. Build faster, smarter, and compliant.
          </p>

          <div className="vp-anim-text h-px w-full bg-white/10 my-8"></div>

          <div className="vp-anim-text grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-root-accent font-bold text-3xl mb-2">100%</h4>
              <p className="text-sm text-root-muted uppercase tracking-wider">Data Residency</p>
            </div>
            <div>
              <h4 className="text-root-accent font-bold text-3xl mb-2">10x</h4>
              <p className="text-sm text-root-muted uppercase tracking-wider">Model Accuracy</p>
            </div>
          </div>
        </div>

        {/* Visual Content */}
        <div
          className="order-1 lg:order-2 relative group perspective-1000"
          onMouseMove={handleTilt}
          onMouseLeave={resetTilt}
        >
          <div className="absolute -inset-1 bg-cyan-500/20 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div ref={imageRef} className="relative aspect-[4/5] bg-root-card overflow-hidden rounded-lg border border-white/5 shadow-2xl will-change-transform">
            {/* This is where your vertical Silent Server video or image should go */}
            <img
              src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965&auto=format&fit=crop"
              alt="Silent Server Node"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 opacity-60 grayscale-[50%]"
            />

            {/* Overlay UI Element */}
            <div className="vp-ui-overlay absolute bottom-8 left-8 right-8 bg-black/80 backdrop-blur-md p-6 rounded border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                {/* Updated to Cyan to match your frames */}
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-root-card border border-white/20"></div>
                <div className="w-3 h-3 rounded-full bg-root-card border border-white/20"></div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-3/4 bg-white/10 rounded"></div>
                <div className="h-2 w-1/2 bg-white/10 rounded"></div>
              </div>
              <div className="mt-4 flex justify-between items-center text-xs text-cyan-400 font-mono tracking-widest">
                <span>STATUS: SILENT</span>
                <span>SECURE</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};