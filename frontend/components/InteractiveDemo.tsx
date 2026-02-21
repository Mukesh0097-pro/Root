import React, { useRef } from 'react';
import { Search, GitBranch, Database, Shield, Cpu } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    label: 'Step 01',
    title: 'Query Input',
    description: 'A user submits a natural language query to the Root platform. The query is parsed, tokenized, and prepared for federated routing.',
    icon: Search,
  },
  {
    label: 'Step 02',
    title: 'Federated Routing',
    description: 'The query is intelligently routed to distributed nodes across the network. A learned routing function identifies which nodes hold relevant knowledge — without exposing content.',
    icon: GitBranch,
  },
  {
    label: 'Step 03',
    title: 'Distributed Retrieval',
    description: 'Each node independently retrieves relevant vectors from its local store. Raw data never leaves the node — only encrypted embeddings are transmitted.',
    icon: Database,
  },
  {
    label: 'Step 04',
    title: 'Secure Aggregation',
    description: 'Results are aggregated using secure multi-party computation. No single node sees the full picture. Differential privacy guarantees are enforced.',
    icon: Shield,
  },
  {
    label: 'Step 05',
    title: 'Response Generation',
    description: 'An LLM generates a coherent, sourced response from the aggregated context. The response includes audit trails and privacy budget accounting.',
    icon: Cpu,
  },
];

// SVG node positions for the visualization
const QUERY_NODE = { cx: 200, cy: 50 };
const DISTRIBUTED_NODES = [
  { cx: 80, cy: 170 },
  { cx: 200, cy: 150 },
  { cx: 320, cy: 170 },
  { cx: 130, cy: 250 },
  { cx: 270, cy: 250 },
];
const AGGREGATION_NODE = { cx: 200, cy: 330 };
const RESPONSE_NODE = { cx: 200, cy: 420 };

export const InteractiveDemo: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Header reveal
    gsap.from('.demo-header', {
      y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: stickyRef.current,
      },
    });

    // --- Step 1: Query node glows ---
    tl.to('.demo-query-node', { fill: '#ccff00', stroke: '#ccff00', duration: 0.3 })
      .to('.demo-query-label', { fill: '#ccff00', duration: 0.2 }, '<')
      .to('.demo-progress-1', { backgroundColor: '#ccff00', duration: 0.2 }, '<');

    // --- Transition 1→2: Route lines animate ---
    tl.to('.demo-step-0', { opacity: 0, y: -20, duration: 0.2 })
      .to('.demo-step-1', { opacity: 1, y: 0, duration: 0.3 }, '-=0.1')
      .to('.demo-route-line', { strokeDashoffset: 0, stagger: 0.05, duration: 0.4 }, '<')
      .to('.demo-progress-2', { backgroundColor: '#ccff00', duration: 0.2 }, '<');

    // --- Transition 2→3: Distributed nodes glow ---
    tl.to('.demo-step-1', { opacity: 0, y: -20, duration: 0.2 })
      .to('.demo-step-2', { opacity: 1, y: 0, duration: 0.3 }, '-=0.1')
      .to('.demo-dist-node', { fill: '#ccff00', stroke: '#ccff00', stagger: 0.04, duration: 0.3 }, '<')
      .to('.demo-dist-label', { fill: '#ccff00', stagger: 0.04, duration: 0.2 }, '<')
      .to('.demo-progress-3', { backgroundColor: '#ccff00', duration: 0.2 }, '<');

    // --- Transition 3→4: Aggregation lines animate ---
    tl.to('.demo-step-2', { opacity: 0, y: -20, duration: 0.2 })
      .to('.demo-step-3', { opacity: 1, y: 0, duration: 0.3 }, '-=0.1')
      .to('.demo-agg-line', { strokeDashoffset: 0, stagger: 0.05, duration: 0.4 }, '<')
      .to('.demo-agg-node', { fill: '#ccff00', stroke: '#ccff00', duration: 0.3 }, '-=0.2')
      .to('.demo-agg-label', { fill: '#ccff00', duration: 0.2 }, '<')
      .to('.demo-progress-4', { backgroundColor: '#ccff00', duration: 0.2 }, '<');

    // --- Transition 4→5: Response line + node ---
    tl.to('.demo-step-3', { opacity: 0, y: -20, duration: 0.2 })
      .to('.demo-step-4', { opacity: 1, y: 0, duration: 0.3 }, '-=0.1')
      .to('.demo-resp-line', { strokeDashoffset: 0, duration: 0.4 }, '<')
      .to('.demo-resp-node', { fill: '#ccff00', stroke: '#ccff00', duration: 0.3 }, '-=0.2')
      .to('.demo-resp-label', { fill: '#ccff00', duration: 0.2 }, '<')
      .to('.demo-progress-5', { backgroundColor: '#ccff00', duration: 0.2 }, '<');

  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative bg-root-bg border-t border-white/5" style={{ height: '180vh' }}>
      {/* Pinned/Sticky Content */}
      <div ref={stickyRef} className="h-screen flex flex-col justify-center">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="mb-10">
            <div className="demo-header text-root-accent text-xs font-bold tracking-widest uppercase mb-4">How It Works</div>
            <h2 className="demo-header text-4xl md:text-5xl font-medium text-white leading-[1.1] mb-4">
              Federated RAG, <span className="text-root-accent">step by step</span>
            </h2>
            <p className="demo-header text-base text-root-muted leading-relaxed max-w-2xl">
              Scroll to see how a query flows through the Root platform — from input to privacy-preserving response.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center">

            {/* Left: Step Text + Progress */}
            <div className="flex gap-6 md:gap-10">
              {/* Vertical Progress Dots */}
              <div className="flex flex-col items-center gap-3 pt-2">
                {STEPS.map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`demo-progress-${i + 1} w-3 h-3 rounded-full border border-white/20 bg-root-card transition-colors`} />
                    {i < STEPS.length - 1 && <div className="w-px h-8 bg-white/10 mt-3" />}
                  </div>
                ))}
              </div>

              {/* Step Text Stack */}
              <div className="relative min-h-[200px]">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={i}
                      className={`demo-step-${i} ${i === 0 ? '' : 'absolute inset-0'}`}
                      style={i !== 0 ? { opacity: 0, transform: 'translateY(20px)' } : {}}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-root-accent/10 border border-root-accent/20 flex items-center justify-center text-root-accent">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-root-accent text-xs font-bold tracking-widest uppercase">{step.label}</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-medium text-white mb-3">{step.title}</h3>
                      <p className="text-root-muted leading-relaxed max-w-lg">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: SVG Node Visualization */}
            <div className="flex items-center justify-center">
              <div className="bg-root-card/40 border border-white/10 rounded-2xl p-6 md:p-10 backdrop-blur-sm w-full max-w-lg">
                <svg viewBox="0 0 400 470" className="w-full h-auto" aria-label="Federated RAG pipeline visualization">

                  {/* --- Connection Lines (initially hidden via dashoffset) --- */}

                  {/* Route lines: Query → Distributed Nodes */}
                  {DISTRIBUTED_NODES.map((node, i) => (
                    <line
                      key={`route-${i}`}
                      className="demo-route-line"
                      x1={QUERY_NODE.cx} y1={QUERY_NODE.cy + 16}
                      x2={node.cx} y2={node.cy - 16}
                      stroke="rgba(204,255,0,0.4)"
                      strokeWidth="1.5"
                      strokeDasharray="200"
                      strokeDashoffset="200"
                    />
                  ))}

                  {/* Aggregation lines: Distributed Nodes → Aggregation */}
                  {DISTRIBUTED_NODES.map((node, i) => (
                    <line
                      key={`agg-${i}`}
                      className="demo-agg-line"
                      x1={node.cx} y1={node.cy + 16}
                      x2={AGGREGATION_NODE.cx} y2={AGGREGATION_NODE.cy - 16}
                      stroke="rgba(204,255,0,0.4)"
                      strokeWidth="1.5"
                      strokeDasharray="200"
                      strokeDashoffset="200"
                    />
                  ))}

                  {/* Response line: Aggregation → Response */}
                  <line
                    className="demo-resp-line"
                    x1={AGGREGATION_NODE.cx} y1={AGGREGATION_NODE.cy + 16}
                    x2={RESPONSE_NODE.cx} y2={RESPONSE_NODE.cy - 16}
                    stroke="rgba(204,255,0,0.4)"
                    strokeWidth="1.5"
                    strokeDasharray="100"
                    strokeDashoffset="100"
                  />

                  {/* --- Nodes --- */}

                  {/* Query Node */}
                  <circle className="demo-query-node" cx={QUERY_NODE.cx} cy={QUERY_NODE.cy} r="16" fill="#0a1414" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  <text className="demo-query-label" x={QUERY_NODE.cx} y={QUERY_NODE.cy + 35} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace">QUERY</text>

                  {/* Distributed Nodes */}
                  {DISTRIBUTED_NODES.map((node, i) => (
                    <g key={`dist-${i}`}>
                      <circle className="demo-dist-node" cx={node.cx} cy={node.cy} r="14" fill="#0a1414" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                      <text className="demo-dist-label" x={node.cx} y={node.cy + 30} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">NODE {i + 1}</text>
                    </g>
                  ))}

                  {/* Aggregation Node */}
                  <circle className="demo-agg-node" cx={AGGREGATION_NODE.cx} cy={AGGREGATION_NODE.cy} r="18" fill="#0a1414" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  <text className="demo-agg-label" x={AGGREGATION_NODE.cx} y={AGGREGATION_NODE.cy + 36} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace">AGGREGATE</text>

                  {/* Response Node */}
                  <circle className="demo-resp-node" cx={RESPONSE_NODE.cx} cy={RESPONSE_NODE.cy} r="16" fill="#0a1414" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  <text className="demo-resp-label" x={RESPONSE_NODE.cx} y={RESPONSE_NODE.cy + 35} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace">RESPONSE</text>

                </svg>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
