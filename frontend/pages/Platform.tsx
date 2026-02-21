import React from 'react';
import { PageHero } from '../components/PageHero';
import { Features } from '../components/Features';
import { VideoShowcase } from '../components/VideoShowcase';
import { TechSpecs } from '../components/TechSpecs';
import { Footer } from '../components/Footer';
import { usePageTitle } from '../hooks/usePageTitle';

const Platform: React.FC = () => {
  usePageTitle('Platform');
  return (
    <>
      <PageHero
        title="The Root"
        accent="Platform."
        subtitle="Three core systems working in unison. Federated vector storage, privacy-preserving LLMs, and automated compliance."
      />
      <Features />
      <VideoShowcase />
      <TechSpecs />
      <Footer />
    </>
  );
};

export default Platform;
