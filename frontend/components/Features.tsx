import React, { useRef } from 'react';
import { ArrowRight, Database, Cpu, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface FeatureSection {
  id: number;
  title: string;
  tagline: string;
  bullets: string[];
  cta: string;
  ctaLink: string;
  gradient: string;
  deviceType: 'tablet' | 'phone';
  deviceImage: string;
  floatingElements: {
    type: 'image' | 'icon' | 'shape';
    src?: string;
    position: string;
    size: string;
    rotation?: number;
    animation?: string;
  }[];
  appIcon: {
    bg: string;
    icon: React.ReactNode;
  };
}

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    id: 0,
    title: "Federated Vector Store",
    tagline: "Index locally. Query globally across the network.",
    bullets: [
      "Distributed Document Indexing",
      "Privacy-First Data Aggregation",
      "Real-time Vector Synchronization"
    ],
    cta: "EXPLORE NODES",
    ctaLink: "/platform",
    gradient: "from-[#000000] via-[#1a0830] to-[#a87fd4]",
    deviceType: 'tablet',
    deviceImage: "/images/Gemini_Generated_Image_2y1cek2y1cek2y1c.png",
    floatingElements: [
      { type: 'image', src: "/images/Gemini_Generated_Image_cgdre2cgdre2cgdr.png", position: "top-8 right-[15%]", size: "w-32 h-32", rotation: -12 },
      { type: 'image', src: "/images/Gemini_Generated_Image_lfrdillfrdillfrd.png", position: "top-4 right-0", size: "w-36 h-44", rotation: 8 },
    ],
    appIcon: {
      bg: "bg-gradient-to-br from-purple-500 to-purple-700",
      icon: <Database className="w-8 h-8 text-white" />
    }
  },
  {
    id: 1,
    title: "Privacy-Preserving LLM",
    tagline: "Fine-tune AI on your data with zero exposure.",
    bullets: [
      "Differential Privacy Guarantees",
      "Secure Model Training",
      "On-Premise Deployment Ready"
    ],
    cta: "LEARN MORE",
    ctaLink: "/platform",
    gradient: "from-[#000000] via-[#2a0840] to-[#b87cb8]",
    deviceType: 'phone',
    deviceImage: "/images/Gemini_Generated_Image_qsli01qsli01qsli.png",
    floatingElements: [
      { type: 'shape', position: "top-12 left-[55%]", size: "w-24 h-24", animation: "animate-float" },
      { type: 'image', src: "/images/Gemini_Generated_Image_vgqrckvgqrckvgqr.png", position: "top-0 right-0", size: "w-32 h-32", rotation: 5 },
    ],
    appIcon: {
      bg: "bg-gradient-to-br from-indigo-600 to-purple-800",
      icon: <Cpu className="w-8 h-8 text-white" />
    }
  },
  {
    id: 2,
    title: "Compliance Engine",
    tagline: "Automated audit trails. Enterprise-grade security.",
    bullets: [
      "GDPR & HIPAA Compliance",
      "Real-time Audit Logging",
      "SOC2 Certification Ready"
    ],
    cta: "VIEW COMPLIANCE",
    ctaLink: "/platform",
    gradient: "from-[#000000] via-[#0a1a14] to-[#4a8a72]",
    deviceType: 'tablet',
    deviceImage: "/images/Gemini_Generated_Image_xfjbgkxfjbgkxfjb.png",
    floatingElements: [
      { type: 'shape', position: "top-4 left-[58%]", size: "w-20 h-28", animation: "animate-float-delayed" },
      { type: 'image', src: "/images/Gemini_Generated_Image_2y1cek2y1cek2y1c.png", position: "top-0 right-0", size: "w-28 h-36", rotation: 6 },
    ],
    appIcon: {
      bg: "bg-gradient-to-br from-root-accent/80 to-green-600",
      icon: <ShieldCheck className="w-8 h-8 text-root-bg" />
    }
  }
];

const DeviceMockup: React.FC<{ type: 'tablet' | 'phone'; image: string; className?: string }> = ({ type, image, className = "" }) => {
  if (type === 'phone') {
    return (
      <div className={`relative ${className}`}>
        {/* Phone Frame */}
        <div className="relative bg-[#1a1a1a] rounded-[3rem] p-2 shadow-2xl border border-white/10">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1a1a1a] rounded-b-2xl z-20" />
          {/* Screen */}
          <div className="relative bg-black rounded-[2.5rem] overflow-hidden aspect-[9/19]">
            {/* Status Bar */}
            <div className="absolute top-2 left-6 right-6 flex justify-between items-center text-white text-xs z-10">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 border border-white rounded-sm">
                  <div className="w-3/4 h-full bg-white rounded-sm" />
                </div>
              </div>
            </div>
            <img src={image} alt="App screen" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Tablet Frame */}
      <div className="relative bg-[#1a1a1a] rounded-[1.5rem] p-3 shadow-2xl border border-white/10">
        {/* Camera */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#333] rounded-full" />
        {/* Screen */}
        <div className="relative bg-white rounded-xl overflow-hidden aspect-[4/3]">
          <img src={image} alt="App screen" className="w-full h-full object-cover" />
          {/* Dock */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 flex items-center gap-2 shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600" />
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600" />
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-400 to-orange-500" />
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-teal-500" />
            <span className="text-xs text-gray-600 ml-1">10</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ feature: FeatureSection; index: number; totalCards: number }> = ({ feature, index, totalCards }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isReversed = index % 2 === 1;

  useGSAP(() => {
    // Animate text elements when card comes into view
    gsap.fromTo(cardRef.current?.querySelectorAll('.animate-text') || [],
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 60%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Animate device
    gsap.fromTo(cardRef.current?.querySelector('.device-mockup') || null,
      { x: isReversed ? -60 : 60, opacity: 0, scale: 0.9 },
      {
        x: 0,
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 60%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Animate floating elements
    gsap.fromTo(cardRef.current?.querySelectorAll('.floating-element') || [],
      { y: 30, opacity: 0, scale: 0.8 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        stagger: 0.15,
        delay: 0.3,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 60%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }, { scope: cardRef });

  return (
    <div
      ref={cardRef}
      className="feature-card-stack absolute inset-4 md:inset-8 lg:inset-12 overflow-hidden rounded-3xl shadow-2xl"
      style={{
        zIndex: index + 1,
      }}
    >
      {/* Card Background with Gradient - top to bottom */}
      <div className={`absolute inset-0 bg-gradient-to-b ${feature.gradient}`} />

      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute w-[800px] h-[800px] rounded-full blur-[200px] opacity-40 ${index === 0 ? 'bg-purple-500/60 bottom-0 right-1/4' :
            index === 1 ? 'bg-fuchsia-600/50 bottom-0 left-1/3' :
              'bg-teal-400/30 bottom-0 right-1/3'
          }`} />
      </div>

      <div className="container mx-auto px-6 h-full relative z-10 flex items-center">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full ${isReversed ? 'lg:flex-row-reverse' : ''}`}>

          {/* Text Content */}
          <div className={`${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
            <h2 className="animate-text text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 leading-tight">
              {feature.title}
            </h2>

            <p className="animate-text text-xl md:text-2xl text-white/70 mb-10 leading-relaxed">
              {feature.tagline}
            </p>

            <div className="space-y-0 mb-12">
              {feature.bullets.map((bullet, i) => (
                <div
                  key={i}
                  className="animate-text py-4 border-b border-white/10 text-white/60 text-lg hover:text-white/90 transition-colors cursor-default"
                >
                  {bullet}
                </div>
              ))}
            </div>

            <button className="animate-text bg-root-accent text-root-bg px-8 py-4 rounded font-bold tracking-wider hover:bg-white transition-colors flex items-center gap-3 group">
              {feature.cta}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Device & Floating Elements */}
          <div className={`relative h-[400px] md:h-[500px] lg:h-[550px] ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>

            {/* Floating Elements */}
            {feature.floatingElements.map((el, i) => (
              <div
                key={i}
                className={`floating-element absolute ${el.position} ${el.size} ${el.animation || ''}`}
                style={{ transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined }}
              >
                {el.type === 'image' && el.src && (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <img src={el.src} alt="" className="w-full h-full object-cover" />
                    {/* Selection corners effect */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-pink-500" />
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-pink-500" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-pink-500" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-pink-500" />
                  </div>
                )}
                {el.type === 'shape' && (
                  <div className="w-full h-full">
                    {/* 3D Glass Sphere */}
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/40 via-transparent to-purple-600/20 backdrop-blur-sm border border-white/20" />
                      <div className="absolute top-2 left-2 w-1/3 h-1/3 rounded-full bg-white/30 blur-sm" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Device Mockup */}
            <DeviceMockup
              type={feature.deviceType}
              image={feature.deviceImage}
              className={`device-mockup absolute ${feature.deviceType === 'phone'
                  ? 'w-[220px] md:w-[260px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                  : 'w-[320px] md:w-[380px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                }`}
            />

            {/* App Icon */}
            <div className="floating-element absolute bottom-8 left-8 md:left-16">
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] ${feature.appIcon.bg} shadow-2xl flex items-center justify-center border border-white/10 backdrop-blur-sm`}>
                {/* Grid overlay */}
                <div className="absolute inset-0 rounded-[1.5rem] opacity-20" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                  backgroundSize: '8px 8px'
                }} />
                {feature.appIcon.icon}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export const Features: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const stackContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const cards = gsap.utils.toArray<HTMLElement>('.feature-card-stack');
    const totalCards = cards.length;

    if (!stackContainerRef.current || cards.length === 0) return;

    // Set initial state - first card visible, others below viewport
    cards.forEach((card, index) => {
      gsap.set(card, {
        yPercent: index === 0 ? 0 : 100,
        scale: 1,
      });
    });

    // Create a master timeline
    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: stackContainerRef.current,
        start: "top 10%",
        end: () => `+=${window.innerHeight * (totalCards - 0.5)}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      }
    });

    // Card 2 (index 1) slides up - happens from 0% to 33% of timeline
    masterTl.to(cards[1], {
      yPercent: 0,
      duration: 1,
      ease: "none",
    }, 0);

    masterTl.to(cards[0], {
      scale: 0.95,
      duration: 1,
      ease: "none",
    }, 0);

    // Card 3 (index 2) slides up - happens from 33% to 66% of timeline
    masterTl.to(cards[2], {
      yPercent: 0,
      duration: 1,
      ease: "none",
    }, 1);

    masterTl.to(cards[1], {
      scale: 0.95,
      duration: 1,
      ease: "none",
    }, 1);

    // Hold the last card in view for the remaining scroll
    masterTl.to({}, { duration: 1 }, 2);

  }, { scope: containerRef, dependencies: [] });

  return (
    <section ref={containerRef} id="platform" className="relative">
      {/* Section Header */}
      <div className="bg-root-bg py-20 border-t border-white/10">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-6xl text-white font-medium mb-4">Root Core Platform</h2>
          <p className="text-xl text-root-muted">Launch a project crafted for sovereignty.</p>
        </div>
      </div>

      {/* Stacking Cards Container */}
      <div
        ref={stackContainerRef}
        className="relative h-[80vh] md:h-[85vh] w-full max-w-7xl mx-auto"
        style={{ overflow: 'hidden' }}
      >
        {/* Cards Wrapper */}
        <div className="relative h-full w-full">
          {FEATURE_SECTIONS.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              index={index}
              totalCards={FEATURE_SECTIONS.length}
            />
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
          {FEATURE_SECTIONS.map((_, index) => (
            <div
              key={index}
              className="w-2 h-8 rounded-full bg-white/20 overflow-hidden"
            />
          ))}
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-2deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 5s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </section>
  );
};