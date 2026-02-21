import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const BigType: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  const sentence = [
    { text: "A", color: "text-white" },
    { text: "new", color: "text-white" },
    { text: "kind", color: "text-white" },
    { text: "of", color: "text-white" },
    { text: "architecture", color: "text-white" },
    { text: "built", color: "text-white" },
    { text: "to", color: "text-white" },
    { text: "federate.", color: "text-root-accent" },
  ];

  useGSAP(() => {
    const words = gsap.utils.toArray('.word-span');

    gsap.fromTo(words,
      {
        opacity: 0.2,
        y: 20
      },
      {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
          end: "bottom 70%",
          scrub: 1,
          toggleActions: "play none none reverse"
        }
      }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-40 bg-root-bg border-t border-white/5 min-h-[50vh] flex items-center">
      <div className="container mx-auto px-6">
        <h2 ref={textRef} className="text-5xl md:text-8xl lg:text-9xl font-medium tracking-tighter leading-[1.1] flex flex-wrap gap-x-6 gap-y-2">
          {sentence.map((word, i) => (
            <span key={i} className={`word-span inline-block ${word.color}`}>
              {word.text}
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
};