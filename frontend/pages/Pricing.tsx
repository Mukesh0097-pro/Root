import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../app/pages/Billing.css';

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        description: 'Perfect for trying out FedKnowledge',
        features: [
            '5 AI queries per day',
            '3 documents',
            'Single department',
            'Basic chat history',
            'Community support',
        ],
        cta: 'Get Started Free',
        ctaLink: '/app/signup',
        popular: false,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 9,
        description: 'For professionals who need more power',
        features: [
            'Unlimited AI queries',
            '50 documents',
            'Federated cross-department search',
            'Priority responses',
            'Advanced analytics',
            'Email support',
        ],
        cta: 'Start Pro Trial',
        ctaLink: '/app/signup',
        popular: true,
    },
    {
        id: 'business',
        name: 'Business',
        price: 29,
        description: 'For teams that collaborate across departments',
        features: [
            'Everything in Pro',
            'Unlimited documents',
            '5 team members included',
            'Admin dashboard',
            'API access',
            'Priority support',
            'Custom branding',
        ],
        cta: 'Start Business Trial',
        ctaLink: '/app/signup',
        popular: false,
    },
];

export default function Pricing() {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <section className="pricing-section">
            <div className="pricing-container">
                <div className="pricing-header-section">
                    <span className="pricing-eyebrow">Pricing</span>
                    <h1 className="pricing-title">
                        Simple, transparent pricing
                    </h1>
                    <p className="pricing-subtitle">
                        Start free, upgrade as you grow. No hidden fees. Cancel anytime.
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="billing-toggle">
                    <span className={billingPeriod === 'monthly' ? 'active' : ''}>Monthly</span>
                    <button
                        className={`toggle-switch ${billingPeriod === 'yearly' ? 'active' : ''}`}
                        onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                    >
                        <div className="toggle-switch__thumb" />
                    </button>
                    <span className={billingPeriod === 'yearly' ? 'active' : ''}>
                        Yearly <span className="save-badge">Save 20%</span>
                    </span>
                </div>

                {/* Plans */}
                <div className="plans-grid">
                    {PLANS.map((plan) => {
                        const yearlyPrice = Math.round(plan.price * 12 * 0.8);
                        const displayPrice = billingPeriod === 'yearly' && plan.price > 0
                            ? `$${yearlyPrice}`
                            : plan.price === 0 ? '$0' : `$${plan.price}`;
                        const period = plan.price === 0 ? 'forever' : billingPeriod === 'yearly' ? '/year' : '/month';

                        return (
                            <div
                                key={plan.id}
                                className={`plan-card ${plan.popular ? 'plan-card--popular' : ''}`}
                            >
                                {plan.popular && <div className="plan-card__badge">Most Popular</div>}
                                <h3 className="plan-card__name">{plan.name}</h3>
                                <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>{plan.description}</p>
                                <div className="plan-card__price">
                                    <span className="plan-card__amount">{displayPrice}</span>
                                    <span className="plan-card__period">{period}</span>
                                </div>
                                <ul className="plan-card__features">
                                    {plan.features.map((feature, i) => (
                                        <li key={i}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to={plan.ctaLink}
                                    className={`plan-card__btn ${plan.popular ? 'plan-card__btn--upgrade' : 'plan-card__btn--free'}`}
                                    style={{ textDecoration: 'none', cursor: 'pointer' }}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        );
                    })}
                </div>

                {/* Trust Section */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '64px',
                    padding: '32px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <p style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>
                        Trusted by teams at innovative companies
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ color: '#555', fontSize: '13px' }}>🔒 256-bit SSL encryption</span>
                        <span style={{ color: '#555', fontSize: '13px' }}>💳 Powered by Stripe</span>
                        <span style={{ color: '#555', fontSize: '13px' }}>📧 14-day money-back guarantee</span>
                    </div>
                </div>
            </div>

            <style>{`
        .pricing-section {
          min-height: 100vh;
          padding: 120px 24px 80px;
        }
        .pricing-container {
          max-width: 1100px;
          margin: 0 auto;
        }
        .pricing-header-section {
          text-align: center;
          margin-bottom: 40px;
        }
        .pricing-eyebrow {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          background: rgba(200, 255, 0, 0.1);
          color: #c8ff00;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 16px;
        }
        .pricing-title {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 800;
          color: #fff;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .pricing-subtitle {
          font-size: 17px;
          color: #888;
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.6;
        }
      `}</style>
        </section>
    );
}
