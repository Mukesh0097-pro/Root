import React from 'react';
import { Hero } from '../components/Hero';
import { BigType } from '../components/BigType';
import { InteractiveDemo } from '../components/InteractiveDemo';
import { ImageCards } from '../components/ImageCards';
import { Comparison } from '../components/Comparison';
import { Highlights } from '../components/Highlights';
import { DevSection } from '../components/DevSection';
import { Stats } from '../components/Stats';
import { HomePreview } from '../components/HomePreview';
import { CTASection } from '../components/CTASection';
import { Footer } from '../components/Footer';

const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <BigType />
      <InteractiveDemo />
      <ImageCards />
      <Comparison />
      <Highlights />
      <DevSection />
      <Stats />
      <HomePreview />
      <CTASection />
      <Footer />
    </>
  );
};

export default Home;
