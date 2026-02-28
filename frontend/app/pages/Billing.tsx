import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import './Billing.css';
interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    features: string[];
    is_current: boolean;
}

interface Subscription {
    plan: string;
    status: string;
    queries_today: number;
    queries_limit: number;
    documents_used: number;
    documents_limit: number;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
}

export default function Billing() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState<string | null>(null);
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [plansData, subData] = await Promise.all([
                api.fetch<Plan[]>('/payments/plans'),
                api.fetch<Subscription>('/payments/subscription'),
            ]);
            setPlans(plansData);
            setSubscription(subData);
        } catch (error) {
            console.error('Failed to load billing data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpgrade(planId: string) {
        setErrorMsg(null);
        setUpgrading(planId);
        try {
            const { checkout_url } = await api.fetch<{ checkout_url: string }>(
                '/payments/create-checkout',
                {
                    method: 'POST',
                    body: JSON.stringify({ plan: planId, billing_period: billingPeriod }),
                }
            );
            window.location.href = checkout_url;
        } catch (error: any) {
            setErrorMsg(error.message || 'Failed to create checkout session. Please try again.');
        } finally {
            setUpgrading(null);
        }
    }

    async function handleManageBilling() {
        setErrorMsg(null);
        try {
            const { portal_url } = await api.fetch<{ portal_url: string }>(
                '/payments/create-portal',
                { method: 'POST' }
            );
            window.location.href = portal_url;
        } catch (error: any) {
            setErrorMsg(
                error.message?.includes('not configured')
                    ? '⚙️ The Stripe Customer Portal is not yet configured. Please visit: Stripe Dashboard → Settings → Billing → Customer Portal to enable it.'
                    : (error.message || 'Failed to open billing portal.')
            );
        }
    }

    if (loading) {
        return (
            <div className="billing-page">
                <div className="billing-loading">
                    <div className="spinner" />
                    <p>Loading billing information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="billing-page">
            {/* Success/Cancel Banners */}
            {success && (
                <div className="billing-banner billing-banner--success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>🎉 Subscription activated successfully! Welcome to the premium experience.</span>
                </div>
            )}
            {canceled && (
                <div className="billing-banner billing-banner--info">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>Payment was cancelled. You can upgrade anytime.</span>
                </div>
            )}
            {errorMsg && (
                <div className="billing-banner billing-banner--error" style={{ cursor: 'pointer' }} onClick={() => setErrorMsg(null)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{errorMsg}</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '0.75rem' }}>Click to dismiss</span>
                </div>
            )}

            {/* Header */}
            <div className="billing-header">
                <h1>Billing & Plans</h1>
                <p>Manage your subscription and usage</p>
            </div>

            {/* Current Usage */}
            {subscription && (
                <div className="billing-usage">
                    <h2>Current Usage</h2>
                    <div className="usage-grid">
                        <div className="usage-card">
                            <div className="usage-card__label">Current Plan</div>
                            <div className="usage-card__value">
                                <span className={`plan-badge plan-badge--${subscription.plan}`}>
                                    {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                                </span>
                            </div>
                        </div>
                        <div className="usage-card">
                            <div className="usage-card__label">Queries Today</div>
                            <div className="usage-card__value">
                                {subscription.queries_today}
                                <span className="usage-card__limit">/ {subscription.queries_limit >= 99999 ? '∞' : subscription.queries_limit}</span>
                            </div>
                            <div className="usage-bar">
                                <div
                                    className="usage-bar__fill"
                                    style={{
                                        width: `${Math.min(100, (subscription.queries_today / Math.min(subscription.queries_limit, 100)) * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="usage-card">
                            <div className="usage-card__label">Documents</div>
                            <div className="usage-card__value">
                                {subscription.documents_used}
                                <span className="usage-card__limit">/ {subscription.documents_limit >= 99999 ? '∞' : subscription.documents_limit}</span>
                            </div>
                            <div className="usage-bar">
                                <div
                                    className="usage-bar__fill"
                                    style={{
                                        width: `${Math.min(100, (subscription.documents_used / Math.min(subscription.documents_limit, 100)) * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                        {subscription.plan !== 'free' && (
                            <div className="usage-card">
                                <div className="usage-card__label">Status</div>
                                <div className="usage-card__value">
                                    <span className={`status-badge status-badge--${subscription.status}`}>
                                        {subscription.status}
                                    </span>
                                </div>
                                {subscription.cancel_at_period_end && (
                                    <div className="usage-card__warning">Cancels at period end</div>
                                )}
                            </div>
                        )}
                    </div>
                    {subscription.plan !== 'free' && (
                        <button className="btn-manage" onClick={handleManageBilling}>
                            Manage Billing →
                        </button>
                    )}
                </div>
            )}

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

            {/* Plans Grid */}
            <div className="plans-grid">
                {plans.map((plan) => {
                    const isCurrent = plan.is_current;
                    const isPopular = plan.id === 'pro';
                    const price = plan.price_monthly;
                    const yearlyPrice = Math.round(price * 12 * 0.8);
                    const displayPrice = billingPeriod === 'yearly' && price > 0
                        ? `$${(yearlyPrice / 100).toFixed(0)}`
                        : price === 0 ? '$0' : `$${(price / 100).toFixed(0)}`;
                    const period = price === 0 ? 'forever' : billingPeriod === 'yearly' ? '/year' : '/month';

                    return (
                        <div
                            key={plan.id}
                            className={`plan-card ${isPopular ? 'plan-card--popular' : ''} ${isCurrent ? 'plan-card--current' : ''}`}
                        >
                            {isPopular && <div className="plan-card__badge">Most Popular</div>}
                            <h3 className="plan-card__name">{plan.name}</h3>
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
                            {isCurrent ? (
                                <button className="plan-card__btn plan-card__btn--current" disabled>
                                    Current Plan
                                </button>
                            ) : plan.id === 'free' ? (
                                <button className="plan-card__btn plan-card__btn--free" disabled>
                                    Free Forever
                                </button>
                            ) : (
                                <button
                                    className="plan-card__btn plan-card__btn--upgrade"
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={upgrading === plan.id}
                                >
                                    {upgrading === plan.id ? (
                                        <><span className="btn-spinner" /> Processing...</>
                                    ) : (
                                        `Upgrade to ${plan.name}`
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* FAQ */}
            <div className="billing-faq">
                <h2>Frequently Asked Questions</h2>
                <div className="faq-grid">
                    <div className="faq-item">
                        <h3>Can I cancel anytime?</h3>
                        <p>Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
                    </div>
                    <div className="faq-item">
                        <h3>What payment methods do you accept?</h3>
                        <p>We accept all major credit cards, debit cards and digital wallets through Stripe's secure payment processing.</p>
                    </div>
                    <div className="faq-item">
                        <h3>What happens when I exceed my limits?</h3>
                        <p>You'll receive a notification to upgrade. Your existing data and conversations are always preserved.</p>
                    </div>
                    <div className="faq-item">
                        <h3>Do you offer refunds?</h3>
                        <p>We offer a 14-day money-back guarantee on all paid plans. Contact support for assistance.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
