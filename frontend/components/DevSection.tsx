import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Token {
  text: string;
  type: 'keyword' | 'string' | 'comment' | 'function' | 'number' | 'plain';
}

function tokenize(code: string, lang: 'python' | 'javascript'): Token[][] {
  const keywords = lang === 'python'
    ? ['from', 'import', 'as', 'def', 'class', 'return', 'if', 'else', 'for', 'in', 'with', 'True', 'False', 'None', 'print', 'await', 'async']
    : ['import', 'from', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'of', 'in', 'new', 'true', 'false', 'null', 'undefined', 'await', 'async', 'console'];

  return code.split('\n').map(line => {
    const tokens: Token[] = [];
    let remaining = line;

    while (remaining.length > 0) {
      // Comment
      const commentChar = lang === 'python' ? '#' : '//';
      if (remaining.startsWith(commentChar)) {
        tokens.push({ text: remaining, type: 'comment' });
        remaining = '';
        continue;
      }

      // String (single or double quotes)
      const strMatch = remaining.match(/^(["'`])(?:(?!\1).)*\1/);
      if (strMatch) {
        tokens.push({ text: strMatch[0], type: 'string' });
        remaining = remaining.slice(strMatch[0].length);
        continue;
      }

      // Keyword or identifier
      const wordMatch = remaining.match(/^[a-zA-Z_]\w*/);
      if (wordMatch) {
        const word = wordMatch[0];
        const isKeyword = keywords.includes(word);
        tokens.push({ text: word, type: isKeyword ? 'keyword' : 'plain' });
        remaining = remaining.slice(word.length);
        continue;
      }

      // Number
      const numMatch = remaining.match(/^\d+\.?\d*/);
      if (numMatch) {
        tokens.push({ text: numMatch[0], type: 'number' });
        remaining = remaining.slice(numMatch[0].length);
        continue;
      }

      // Everything else (operators, punctuation, whitespace)
      tokens.push({ text: remaining[0], type: 'plain' });
      remaining = remaining.slice(1);
    }

    return tokens;
  });
}

const TOKEN_COLORS: Record<Token['type'], string> = {
  keyword: 'text-root-accent',
  string: 'text-emerald-400',
  comment: 'text-white/30 italic',
  function: 'text-cyan-400',
  number: 'text-orange-400',
  plain: 'text-root-text',
};

const CODE_PYTHON = `from root import FederatedClient

# Initialize with your API key
client = FederatedClient(
    api_key="your-api-key",
    region="us-west-2"
)

# Run a federated query across all nodes
results = client.query(
    "What are the key risk factors?",
    privacy_budget=0.1,
    top_k=10
)

print(results.answer)
print(f"Sources: {len(results.sources)} nodes")`;

const CODE_JS = `import { FederatedClient } from '@root/sdk';

// Initialize with your API key
const client = new FederatedClient({
  apiKey: 'your-api-key',
  region: 'us-west-2',
});

// Run a federated query across all nodes
const results = await client.query(
  'What are the key risk factors?',
  { privacyBudget: 0.1, topK: 10 }
);

console.log(results.answer);
console.log(\`Sources: \${results.sources.length} nodes\`);`;

export const DevSection: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const codeRef = useRef<HTMLPreElement>(null);
  const [activeTab, setActiveTab] = useState<'python' | 'javascript'>('python');

  useGSAP(() => {
    gsap.from('.dev-text', {
      y: 50, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 80%' },
    });
    gsap.from('.dev-code', {
      y: 40, opacity: 0, scale: 0.97, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 75%' },
    });
  }, { scope: containerRef });

  const switchTab = (tab: 'python' | 'javascript') => {
    if (tab === activeTab) return;
    gsap.to(codeRef.current, {
      opacity: 0,
      y: 10,
      duration: 0.15,
      ease: 'power2.in',
      onComplete: () => {
        setActiveTab(tab);
        gsap.fromTo(codeRef.current,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.25, ease: 'power3.out' }
        );
      },
    });
  };

  const code = activeTab === 'python' ? CODE_PYTHON : CODE_JS;
  const lines = tokenize(code, activeTab);

  return (
    <section ref={containerRef} className="py-32 bg-root-bg border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: Text */}
          <div>
            <div className="dev-text text-root-accent text-xs font-bold tracking-widest uppercase mb-4">Developer Experience</div>
            <h2 className="dev-text text-4xl md:text-5xl font-medium text-white leading-[1.1] mb-6">
              Start building in <span className="text-root-accent">minutes</span>
            </h2>
            <p className="dev-text text-lg text-root-muted leading-relaxed mb-6">
              Initialize the federated client, run a privacy-preserving query, and get results — all in a few lines of code. Available in Python and JavaScript.
            </p>
            <p className="dev-text text-root-muted leading-relaxed mb-10">
              Our SDK handles secure node routing, encryption, and differential privacy budgeting under the hood. You focus on building.
            </p>
            <div className="dev-text">
              <Link
                to="/platform"
                className="bg-root-accent hover:bg-white text-root-bg font-bold px-8 py-4 rounded-lg uppercase tracking-wider text-sm transition-colors duration-300 inline-flex items-center gap-2 group"
              >
                View Full Docs
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right: Code Block */}
          <div className="dev-code">
            <div className="bg-root-card/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">

              {/* Tab Bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-root-muted" />
                  <span className="text-root-muted text-xs font-mono uppercase tracking-wider">
                    {activeTab === 'python' ? 'main.py' : 'index.js'}
                  </span>
                </div>
                <div className="flex gap-1 bg-root-bg/60 rounded-lg p-1">
                  <button
                    onClick={() => switchTab('python')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold tracking-wider uppercase transition-colors duration-200 ${activeTab === 'python'
                        ? 'bg-root-accent text-root-bg'
                        : 'text-root-muted hover:text-white'
                      }`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => switchTab('javascript')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold tracking-wider uppercase transition-colors duration-200 ${activeTab === 'javascript'
                        ? 'bg-root-accent text-root-bg'
                        : 'text-root-muted hover:text-white'
                      }`}
                  >
                    JavaScript
                  </button>
                </div>
              </div>

              {/* Code Content */}
              <pre
                ref={codeRef}
                className="p-6 overflow-x-auto text-sm leading-relaxed font-mono"
              >
                <code>
                  {lines.map((lineTokens, lineIdx) => (
                    <div key={lineIdx} className="flex">
                      <span className="text-white/20 select-none w-8 text-right mr-4 flex-shrink-0">{lineIdx + 1}</span>
                      <span>
                        {lineTokens.map((token, tokenIdx) => (
                          <span key={tokenIdx} className={TOKEN_COLORS[token.type]}>{token.text}</span>
                        ))}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
