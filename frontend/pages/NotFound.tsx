import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

const NotFound: React.FC = () => {
  usePageTitle('Page Not Found');
  return (
    <section className="min-h-screen bg-root-bg flex items-center justify-center">
      <div className="container mx-auto px-6 text-center max-w-2xl">
        <div className="text-[120px] md:text-[180px] font-bold text-root-card leading-none tracking-tighter select-none mb-4">
          404
        </div>
        <h1 className="text-3xl md:text-5xl font-medium text-white mb-4">Page not found</h1>
        <p className="text-root-muted text-lg leading-relaxed mb-10">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-root-accent hover:bg-white text-root-bg font-bold px-8 py-4 rounded-lg uppercase tracking-wider text-sm transition-colors duration-300 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>
    </section>
  );
};

export default NotFound;
