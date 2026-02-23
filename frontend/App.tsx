import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import Solutions from './pages/Solutions';
import Platform from './pages/Platform';
import Research from './pages/Research';
import Company from './pages/Company';
import ContactPage from './pages/Contact';
import Pricing from './pages/Pricing';
import NotFound from './pages/NotFound';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Platform imports
import { AuthProvider } from './app/context/AuthContext';
import { ToastProvider } from './app/components/common/Toast';
import { ProtectedRoute } from './app/components/common/ProtectedRoute';
import Login from './app/pages/Login';
import Signup from './app/pages/Signup';
import { AppLayout } from './app/layouts/AppLayout';
import { AdminLayout } from './app/layouts/AdminLayout';
import Chat from './app/pages/Chat';
import AdminDashboard from './app/pages/AdminDashboard';
import AdminDocuments from './app/pages/AdminDocuments';
import AdminUsers from './app/pages/AdminUsers';
import AdminAnalytics from './app/pages/AdminAnalytics';
import Billing from './app/pages/Billing';

gsap.registerPlugin(ScrollTrigger);

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith('/app')) return;
    window.scrollTo(0, 0);
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }, [pathname]);

  return null;
}

function App() {
  const location = useLocation();
  const isApp = location.pathname.startsWith('/app');

  useEffect(() => {
    if (isApp) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const refreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(refreshTimeout);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [isApp]);

  return (
    <div className="min-h-screen bg-root-bg selection:bg-root-accent selection:text-root-bg overflow-x-hidden max-w-[100vw]">
      <ScrollToTop />

      {!isApp && <Navbar />}

      <Routes>
        {/* Marketing routes */}
        <Route path="/" element={<main><Home /></main>} />
        <Route path="/solutions" element={<main><Solutions /></main>} />
        <Route path="/platform" element={<main><Platform /></main>} />
        <Route path="/research" element={<main><Research /></main>} />
        <Route path="/company" element={<main><Company /></main>} />
        <Route path="/contact" element={<main><ContactPage /></main>} />
        <Route path="/pricing" element={<main><Pricing /></main>} />

        {/* Platform routes */}
        <Route path="/app/login" element={
          <AuthProvider>
            <ToastProvider>
              <Login />
            </ToastProvider>
          </AuthProvider>
        } />
        <Route path="/app/signup" element={
          <AuthProvider>
            <ToastProvider>
              <Signup />
            </ToastProvider>
          </AuthProvider>
        } />
        <Route path="/app" element={
          <AuthProvider>
            <ToastProvider>
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            </ToastProvider>
          </AuthProvider>
        }>
          <Route index element={<Chat />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:conversationId" element={<Chat />} />
          <Route path="billing" element={<Billing />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
