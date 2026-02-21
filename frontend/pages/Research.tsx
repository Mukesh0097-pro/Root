import React from 'react';
import { PageHero } from '../components/PageHero';
import { Pillars } from '../components/Pillars';
import { Publications, Methodology } from '../components/Publications';
import { Footer } from '../components/Footer';
import { usePageTitle } from '../hooks/usePageTitle';

const Research: React.FC = () => {
  usePageTitle('Research');
  return (
    <>
      <PageHero
        title="AI Research"
        accent="& Publications."
        subtitle="Advancing the frontier of federated learning, secure multi-party computation, and distributed retrieval-augmented generation."
      />
      <Pillars />
      <Methodology />
      <Publications />
      <Footer />
    </>
  );
};

export default Research;
