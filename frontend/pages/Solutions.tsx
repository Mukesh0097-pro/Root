import React from 'react';
import { PageHero } from '../components/PageHero';
import { ValueProp } from '../components/ValueProp';
import { UseCases, SolutionsCTA } from '../components/UseCases';
import { Footer } from '../components/Footer';
import { usePageTitle } from '../hooks/usePageTitle';

const Solutions: React.FC = () => {
  usePageTitle('Solutions');
  return (
    <>
      <PageHero
        title="Enterprise AI"
        accent="Solutions."
        subtitle="Federated intelligence for regulated industries. Break down data silos without moving a single byte."
      />
      <ValueProp />
      <UseCases />
      <SolutionsCTA />
      <Footer />
    </>
  );
};

export default Solutions;
