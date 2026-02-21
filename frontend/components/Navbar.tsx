import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';

const NAV_ITEMS = [
  { label: 'SOLUTIONS', href: '/solutions' },
  { label: 'PLATFORM', href: '/platform' },
  { label: 'AI RESEARCH', href: '/research' },
  { label: 'COMPANY', href: '/company' },
];

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-6">
      <div className="container mx-auto px-6 flex items-center justify-between font-sans">

        {/* Left: Logo Badge */}
        <Link to="/" className="flex items-center gap-3 bg-root-card/80 backdrop-blur-md border border-white/10 rounded-lg px-5 py-2.5 group cursor-pointer hover:border-root-accent/50 transition-all duration-300">
          <Logo className="h-6" />
          <span className="text-xl font-bold tracking-tight text-root-accent">Root</span>
        </Link>

        {/* Center/Right: Nav Links Badge + CTA */}
        <div className="flex items-center gap-3">

            {/* Desktop Nav Badge */}
            <div className="hidden md:flex items-center gap-8 bg-root-card/80 backdrop-blur-md border border-white/10 rounded-lg px-8 py-3">
            {NAV_ITEMS.map((item) => (
                <Link
                key={item.label}
                to={item.href}
                className={`text-xs font-bold tracking-widest transition-colors uppercase ${
                  location.pathname === item.href
                    ? 'text-root-accent'
                    : 'text-white hover:text-root-accent'
                }`}
                >
                {item.label}
                </Link>
            ))}
            </div>

            {/* CTA Buttons */}
            <Link to="/app/login" className="hidden md:block bg-root-card/80 backdrop-blur-md border border-white/10 text-white px-6 py-3 text-xs font-bold tracking-wider rounded-lg hover:border-root-accent/50 hover:text-root-accent transition-all duration-300 uppercase">
            Login
            </Link>
            <Link to="/contact" className="hidden md:block bg-root-accent text-root-bg px-8 py-3 text-xs font-bold tracking-wider rounded-lg hover:bg-white transition-colors duration-300 uppercase">
            Contact
            </Link>

            {/* Mobile Toggle */}
            <button
            className="md:hidden flex items-center justify-center w-12 h-12 bg-root-card/80 backdrop-blur-md border border-white/10 rounded-lg text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-24 left-0 right-0 px-6 z-50">
            <div className="bg-root-card border border-white/10 rounded-xl p-6 flex flex-col gap-6 shadow-2xl backdrop-blur-xl">
                {NAV_ITEMS.map((item) => (
                    <Link
                    key={item.label}
                    to={item.href}
                    className={`text-sm font-bold tracking-widest border-b border-white/5 pb-4 last:border-0 ${
                      location.pathname === item.href
                        ? 'text-root-accent'
                        : 'text-white hover:text-root-accent'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    >
                    {item.label}
                    </Link>
                ))}
                <Link to="/app/login" className="bg-root-card border border-white/10 text-white px-6 py-4 text-sm font-bold tracking-wide rounded-lg w-full uppercase text-center" onClick={() => setIsMobileMenuOpen(false)}>
                    Login
                </Link>
                <Link to="/contact" className="bg-root-accent text-root-bg px-6 py-4 text-sm font-bold tracking-wide rounded-lg w-full uppercase text-center" onClick={() => setIsMobileMenuOpen(false)}>
                    Contact
                </Link>
            </div>
        </div>
      )}
    </nav>
  );
};
