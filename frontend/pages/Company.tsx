import React from 'react';
import { PageHero } from '../components/PageHero';
import { AboutSection } from '../components/AboutSection';
import { Mission, Team, Contact } from '../components/CompanySections';
import { Footer } from '../components/Footer';
import { usePageTitle } from '../hooks/usePageTitle';

const Company: React.FC = () => {
  usePageTitle('Company');
  return (
    <>
      <PageHero
        title="Building the Future"
        accent="of Federated AI."
        subtitle="Meet the team, our mission, and the principles driving privacy-preserving intelligence infrastructure."
      />
      <Mission />
      <AboutSection />
      <Team />
      <Contact />
      <Footer />
    </>
  );
};

export default Company;
