import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PAPERS = [
  {
    tag: 'FEDERATED LEARNING',
    title: 'Scalable Federated Vector Indexing for Privacy-Preserving RAG',
    abstract: 'We introduce a novel approach to distributed vector indexing that enables sub-5ms retrieval across 50,000+ nodes while maintaining differential privacy guarantees.',
    date: '2026',
    color: 'text-purple-400',
    borderColor: 'hover:border-purple-400/30',
  },
  {
    tag: 'SECURE COMPUTATION',
    title: 'Zero-Trust Model Training with Homomorphic Encryption',
    abstract: 'A framework for training large language models on encrypted data, eliminating the need for data decryption during the training pipeline.',
    date: '2025',
    color: 'text-cyan-400',
    borderColor: 'hover:border-cyan-400/30',
  },
  {
    tag: 'DISTRIBUTED SYSTEMS',
    title: 'Consensus Protocols for Federated Knowledge Graphs',
    abstract: 'Proposing a Byzantine fault-tolerant consensus mechanism optimized for knowledge graph synchronization in adversarial federated environments.',
    date: '2025',
    color: 'text-teal-400',
    borderColor: 'hover:border-teal-400/30',
  },
  {
    tag: 'DIFFERENTIAL PRIVACY',
    title: 'Practical Privacy Budgets for Enterprise RAG Deployments',
    abstract: 'Balancing retrieval accuracy with formal privacy guarantees. We show how adaptive epsilon scheduling achieves near-zero utility loss.',
    date: '2026',
    color: 'text-root-accent',
    borderColor: 'hover:border-root-accent/30',
  },
];

export const Publications: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.pub-header', {
      y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 85%' },
    });
    gsap.from('.pub-card', {
      y: 60, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 75%', toggleActions: 'play none none reverse' },
    });
  }, { scope: containerRef });

  const onHover = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, { y: -6, duration: 0.4, ease: 'power3.out' });
  };
  const onLeave = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, { y: 0, duration: 0.4, ease: 'power3.out' });
  };

  return (
    <section ref={containerRef} className="py-24 bg-root-bg border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="pub-header mb-16">
          <h2 className="text-4xl md:text-6xl font-medium text-white mb-4">Publications</h2>
          <p className="text-lg text-root-muted max-w-2xl">Peer-reviewed research from the Root Labs team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PAPERS.map((paper, i) => (
            <Link
              key={i}
              to="/research"
              className={`pub-card group bg-root-card/40 border border-white/10 rounded-2xl p-8 md:p-10 backdrop-blur-sm transition-colors duration-300 cursor-pointer block ${paper.borderColor}`}
              onMouseEnter={onHover}
              onMouseLeave={onLeave}
              aria-label={`Read paper: ${paper.title}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-mono font-bold tracking-wider uppercase ${paper.color}`}>{paper.tag}</span>
                <span className="text-xs text-root-muted font-mono">{paper.date}</span>
              </div>
              <h3 className="text-xl md:text-2xl font-medium text-white mb-3 group-hover:text-root-accent transition-colors duration-300 leading-tight">{paper.title}</h3>
              <p className="text-root-muted leading-relaxed text-sm mb-6">{paper.abstract}</p>
              <div className="flex items-center gap-1 text-root-accent text-sm font-bold tracking-wider uppercase">
                <span>Read Paper</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const STEPS = [
  {
    num: '01',
    title: 'Local Indexing',
    description: 'Each node independently indexes its local data into vector embeddings. Data never leaves the premises. Indexing runs on-device or on-premise.',
  },
  {
    num: '02',
    title: 'Federated Aggregation',
    description: 'Gradient updates and index metadata are securely aggregated using homomorphic encryption. Only mathematical artifacts are shared — never raw data.',
  },
  {
    num: '03',
    title: 'Global Query Routing',
    description: 'Incoming queries are routed to relevant nodes using a learned routing function. The system identifies which nodes hold relevant knowledge without exposing content.',
  },
  {
    num: '04',
    title: 'Privacy-Preserving Retrieval',
    description: 'Results are retrieved with differential privacy guarantees. Each response comes with a formal privacy budget accounting, ensuring cumulative compliance.',
  },
];

export const Methodology: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.method-header', {
      y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 85%' },
    });
    gsap.from('.method-step', {
      x: -40, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 70%', toggleActions: 'play none none reverse' },
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-24 bg-root-bg border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="method-header mb-16">
          <h2 className="text-4xl md:text-6xl font-medium text-white mb-4">How It Works</h2>
          <p className="text-lg text-root-muted max-w-2xl">The federated RAG pipeline, step by step.</p>
        </div>

        <div className="grid grid-cols-1 gap-0">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="method-step group flex gap-6 md:gap-10 py-10 border-b border-white/10 last:border-0 hover:bg-root-card/20 transition-colors duration-300 px-4 -mx-4 rounded-lg"
            >
              <div className="text-root-accent font-mono text-4xl md:text-5xl font-bold tracking-tight opacity-40 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0 w-16 md:w-20">
                {step.num}
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-medium text-white mb-3 group-hover:text-root-accent transition-colors duration-300">{step.title}</h3>
                <p className="text-root-muted leading-relaxed max-w-2xl">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
