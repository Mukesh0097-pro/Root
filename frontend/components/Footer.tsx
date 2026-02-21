import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const Footer: React.FC = () => {
  const container = useRef<HTMLElement>(null);
  const bigTextRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useGSAP(() => {
    // Reveal Content
    gsap.from(".footer-content", {
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: container.current,
        start: "top 80%",
      }
    });
  }, { scope: container });

  return (
    <footer ref={container} id="company" className="bg-root-bg border-t border-white/10 relative overflow-x-hidden">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 relative z-10">

        {/* Two-panel grid: links left | divider | subscribe right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_auto_0.8fr] gap-12 pt-24 pb-20">

          {/* Left: 3-column links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 lg:gap-14">
            {/* Column 1 */}
            <div className="footer-content flex flex-col gap-6">
              <h4 className="text-root-accent font-mono text-sm uppercase tracking-wider">[ PLATFORM ]</h4>
              <ul className="space-y-5 flex flex-col">
                <li><Link to="/platform" className="text-white text-xs font-bold tracking-[0.15em] hover:text-root-accent transition-colors uppercase">FEATURES</Link></li>
                <li><Link to="/solutions" className="text-white text-xs font-bold tracking-[0.15em] hover:text-root-accent transition-colors uppercase">SOLUTIONS</Link></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="footer-content flex flex-col gap-6">
              <h4 className="text-root-accent font-mono text-sm uppercase tracking-wider">[ RESEARCH ]</h4>
              <ul className="space-y-5 flex flex-col">
                <li><Link to="/research" className="text-white text-xs font-bold tracking-[0.15em] hover:text-root-accent transition-colors uppercase">PUBLICATIONS</Link></li>
                <li><Link to="/company" className="text-white text-xs font-bold tracking-[0.15em] hover:text-root-accent transition-colors uppercase">ABOUT</Link></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="footer-content flex flex-col gap-6">
              <h4 className="text-root-accent font-mono text-sm uppercase tracking-wider">[ CONNECT ]</h4>
              <ul className="space-y-5 flex flex-col">
                <li><Link to="/contact" className="text-white text-xs font-bold tracking-[0.15em] hover:text-root-accent transition-colors uppercase">CONTACT</Link></li>
                <li><a href="mailto:hello@rootsystems.ai" className="text-white text-xs font-bold tracking-[0.15em] hover:text-root-accent transition-colors uppercase">EMAIL US</a></li>
              </ul>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden lg:block w-px bg-white/10 self-stretch"></div>

          {/* Right: Subscribe */}
          <div className="footer-content flex flex-col gap-5">
            <h4 className="text-root-accent font-mono text-sm uppercase tracking-wider">[ SUBSCRIBE ]</h4>
            {subscribed ? (
              <div className="bg-root-accent/10 border border-root-accent/20 rounded-lg px-5 py-4 text-center">
                <p className="text-root-accent text-sm font-bold">Subscribed!</p>
                <p className="text-root-muted text-xs mt-1">We'll keep you posted.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (email) { setSubscribed(true); setEmail(''); } }} className="flex flex-col gap-4">
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address for newsletter subscription"
                  className="w-full bg-[#0f1212] border border-white/10 rounded-lg px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-root-accent/50 transition-colors font-mono text-sm"
                />
                <button type="submit" className="w-full bg-root-accent hover:bg-root-accentHover text-root-bg font-bold py-3.5 rounded-lg uppercase tracking-wider text-xs transition-colors shadow-[0_0_20px_rgba(204,255,0,0.1)]">
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-content flex flex-col md:flex-row justify-between items-center pb-8 pt-8 border-t border-white/5">
          <div className="mb-6 md:mb-0">
            <Logo className="h-8" />
          </div>
          <div className="text-root-accent font-mono text-[10px] md:text-xs uppercase tracking-widest flex items-center flex-wrap gap-3 md:gap-6">
            <span>© 2026 ROOT SYSTEMS</span>
            <span className="text-white/20">|</span>
            <Link to="/company" className="hover:text-white transition-colors">PRIVACY POLICY</Link>
            <span className="text-white/20">|</span>
            <Link to="/company" className="hover:text-white transition-colors">SITEMAP</Link>
          </div>
        </div>
      </div>

      {/* Big Background Text — clipped, only top portion visible */}
      <div className="w-full pointer-events-none select-none overflow-hidden" style={{ height: 'clamp(100px, 14vw, 240px)' }}>
        <div ref={bigTextRef} className="flex justify-center">
          <span className="block text-[22vw] font-bold tracking-tighter whitespace-nowrap text-[#1a2626]" style={{ lineHeight: '1' }}>
            Root
          </span>
        </div>
      </div>
    </footer>
  );
};