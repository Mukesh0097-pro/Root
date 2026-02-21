import React, { useRef, useState } from 'react';
import { ArrowRight, Mail, MapPin, Phone, Clock, Send, CheckCircle } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { Footer } from '../components/Footer';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePageTitle } from '../hooks/usePageTitle';

gsap.registerPlugin(ScrollTrigger);

const CONTACT_METHODS = [
  {
    icon: Mail,
    label: 'Email Us',
    value: 'hello@rootsystems.ai',
    description: 'For general inquiries and partnerships',
  },
  {
    icon: Phone,
    label: 'Call Us',
    value: '+1 (415) 906-4177',
    description: 'Mon-Fri, 9am-6pm PST',
  },
  {
    icon: MapPin,
    label: 'Visit Us',
    value: 'San Francisco, CA',
    description: '548 Market St, Suite 36000',
  },
  {
    icon: Clock,
    label: 'Office Hours',
    value: '9:00 AM - 6:00 PM',
    description: 'Pacific Standard Time',
  },
];

const Contact: React.FC = () => {
  usePageTitle('Contact');
  const formRef = useRef<HTMLElement>(null);
  const methodsRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', company: '', subject: '', message: '' });

  useGSAP(() => {
    gsap.from('.method-card', {
      y: 60,
      opacity: 0,
      scale: 0.95,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: methodsRef.current, start: 'top 85%' },
    });
  }, { scope: methodsRef });

  useGSAP(() => {
    gsap.from('.form-section', {
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: { trigger: formRef.current, start: 'top 80%' },
    });
  }, { scope: formRef });

  useGSAP(() => {
    gsap.from('.faq-item', {
      y: 40,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: faqRef.current, start: 'top 85%' },
    });
  }, { scope: faqRef });

  const onMethodHover = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { y: -8, scale: 1.03, duration: 0.35, ease: 'power3.out' });
  };
  const onMethodLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { y: 0, scale: 1, duration: 0.35, ease: 'power3.out' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormData({ name: '', email: '', company: '', subject: '', message: '' });
  };

  return (
    <>
      <PageHero
        title="Let's Connect"
        accent="& Build Together."
        subtitle="Have a question about federated AI? Want to explore how Root can transform your data strategy? We'd love to hear from you."
      />

      {/* Contact Methods Grid */}
      <section ref={methodsRef} className="py-24 bg-root-bg border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CONTACT_METHODS.map((method, i) => {
              const Icon = method.icon;
              return (
                <div
                  key={i}
                  className="method-card group bg-root-card/40 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:border-root-accent/30 transition-colors duration-300 cursor-pointer"
                  onMouseEnter={onMethodHover}
                  onMouseLeave={onMethodLeave}
                >
                  <div className="w-12 h-12 rounded-xl bg-root-accent/10 border border-root-accent/20 flex items-center justify-center text-root-accent mb-5 group-hover:bg-root-accent/20 transition-colors duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-root-accent text-xs font-bold tracking-widest uppercase mb-2">{method.label}</div>
                  <h3 className="text-lg font-medium text-white mb-1 group-hover:text-root-accent transition-colors duration-300">{method.value}</h3>
                  <p className="text-root-muted text-sm">{method.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form + Map */}
      <section ref={formRef} className="py-24 bg-root-bg border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left: Form */}
            <div className="form-section">
              <h2 className="text-3xl md:text-5xl font-medium text-white mb-4">Send Us a Message</h2>
              <p className="text-root-muted leading-relaxed mb-10">Fill out the form below and our team will get back to you within 24 hours.</p>

              {submitted ? (
                <div className="bg-root-card/40 border border-root-accent/30 rounded-2xl p-10 backdrop-blur-sm flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-root-accent/10 border border-root-accent/20 flex items-center justify-center text-root-accent mb-6">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-medium text-white mb-2">Message Sent!</h3>
                  <p className="text-root-muted">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-root-card/40 border border-white/10 rounded-2xl p-8 md:p-10 backdrop-blur-sm space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="text-xs text-root-muted font-bold tracking-wider uppercase block mb-2">Name</label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-root-bg border border-white/10 rounded-lg px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-root-accent/50 transition-colors font-mono text-sm"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="text-xs text-root-muted font-bold tracking-wider uppercase block mb-2">Email</label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-root-bg border border-white/10 rounded-lg px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-root-accent/50 transition-colors font-mono text-sm"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-company" className="text-xs text-root-muted font-bold tracking-wider uppercase block mb-2">Company</label>
                      <input
                        id="contact-company"
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full bg-root-bg border border-white/10 rounded-lg px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-root-accent/50 transition-colors font-mono text-sm"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-subject" className="text-xs text-root-muted font-bold tracking-wider uppercase block mb-2">Subject</label>
                      <input
                        id="contact-subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full bg-root-bg border border-white/10 rounded-lg px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-root-accent/50 transition-colors font-mono text-sm"
                        placeholder="How can we help?"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="text-xs text-root-muted font-bold tracking-wider uppercase block mb-2">Message</label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-root-bg border border-white/10 rounded-lg px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-root-accent/50 transition-colors font-mono text-sm resize-none"
                      placeholder="Tell us about your project or use case..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-root-accent hover:bg-white text-root-bg font-bold py-4 rounded-lg uppercase tracking-wider text-sm transition-colors duration-300 flex items-center justify-center gap-2 group"
                  >
                    Send Message
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              )}
            </div>

            {/* Right: Additional Info */}
            <div className="form-section space-y-8">
              {/* Map Placeholder */}
              <div className="bg-root-card/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="relative h-64 bg-gradient-to-br from-root-card to-root-bg flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-root-accent/30 animate-ping" style={{ animationDuration: '3s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-root-accent/50" />
                  </div>
                  <div className="relative text-center">
                    <MapPin className="w-8 h-8 text-root-accent mx-auto mb-3" />
                    <p className="text-white font-medium">San Francisco, CA</p>
                    <p className="text-root-muted text-sm">548 Market St, Suite 36000</p>
                  </div>
                </div>
              </div>

              {/* Quick Response Promise */}
              <div className="bg-root-card/40 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <h3 className="text-xl font-medium text-white mb-4">Why Reach Out?</h3>
                <div className="space-y-4">
                  {[
                    'Explore enterprise federated RAG solutions',
                    'Request a live platform demo',
                    'Discuss partnership opportunities',
                    'Get quotes for custom deployments',
                    'Technical questions about our stack',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <ArrowRight className="w-4 h-4 text-root-accent mt-0.5 flex-shrink-0" />
                      <span className="text-root-muted text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-gradient-to-br from-root-accent/10 to-transparent border border-root-accent/20 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-3 h-3 rounded-full bg-root-accent animate-pulse" />
                  <span className="text-root-accent text-xs font-bold tracking-widest uppercase">Avg. Response Time</span>
                </div>
                <p className="text-4xl font-bold text-white">{'< 24h'}</p>
                <p className="text-root-muted text-sm mt-1">For all business inquiries</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef} className="py-24 bg-root-bg border-t border-white/5">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="faq-item text-3xl md:text-5xl font-medium text-white mb-4 text-center">Frequently Asked</h2>
          <p className="faq-item text-root-muted text-center mb-16 text-lg">Quick answers to common questions.</p>

          <div className="space-y-4">
            {[
              { q: 'What industries do you serve?', a: 'We serve healthcare, financial services, government, legal, and any industry dealing with sensitive or regulated data that needs AI capabilities without compromising privacy.' },
              { q: 'How does federated RAG differ from traditional RAG?', a: 'Traditional RAG requires centralizing data. Federated RAG keeps data distributed across nodes while still enabling intelligent retrieval and generation, ensuring data sovereignty.' },
              { q: 'Can I get a demo of the platform?', a: 'Reach out through the form above or email us directly. We offer personalized demos tailored to your industry and use case.' },
              { q: 'What compliance frameworks do you support?', a: 'Root is built for GDPR, HIPAA, SOC2, and CCPA compliance out of the box. Our compliance engine can be configured for additional regulatory requirements.' },
            ].map((item, i) => (
              <div key={i} className="faq-item bg-root-card/40 border border-white/10 rounded-xl p-6 hover:border-root-accent/20 transition-colors duration-300">
                <h4 className="text-white font-medium mb-2">{item.q}</h4>
                <p className="text-root-muted text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Contact;
