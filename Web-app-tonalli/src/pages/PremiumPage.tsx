import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Rocket, Sparkles } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { apiService } from '../services/api';

type PlanType = 'free' | 'pro' | 'max';

const PLANS: Array<{
  key: PlanType;
  label: string;
  price: string;
  cadence: string;
  accent: string;
  icon: typeof Sparkles;
  cta: string;
  benefits: string[];
}> = [
  {
    key: 'free',
    label: 'Free',
    price: '$0',
    cadence: 'forever',
    accent: '#94A3B8',
    icon: Sparkles,
    cta: 'Current foundation',
    benefits: [
      'Starter access for new learners',
      'Two quiz attempts per lesson module',
      'No paid subscription required',
    ],
  },
  {
    key: 'pro',
    label: 'Pro',
    price: '$3',
    cadence: '/month',
    accent: '#E91E8C',
    icon: Rocket,
    cta: 'Start Pro checkout',
    benefits: [
      'Unlock every Pro chapter immediately',
      'Unlimited lesson quiz retries',
      'Final certification unlocks at the Pro tier',
    ],
  },
  {
    key: 'max',
    label: 'Max',
    price: '$8',
    cadence: '/month',
    accent: '#F5A623',
    icon: Crown,
    cta: 'Start Max checkout',
    benefits: [
      'Everything in Pro',
      'Access to Max-only chapters',
      'Certificates included with the top tier',
    ],
  },
];

export function PremiumPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPlan = user?.plan || 'free';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutState = params.get('checkout');

    if (checkoutState === 'cancelled') {
      setBanner('Checkout canceled. You can pick up again whenever you are ready.');
      return;
    }

    if (checkoutState === 'success' && user) {
      apiService.getProfile()
        .then((profile) => {
          setUser(profile);
          setBanner('Payment received. Your subscription status has been refreshed from the server.');
        })
        .catch(() => {
          setBanner('Payment received. Stripe may still be finishing the webhook sync, so refresh again in a moment if needed.');
        });
    }
  }, [setUser, user]);

  const subtitle = useMemo(() => {
    if (currentPlan === 'max') return 'You are on the top tier with full chapter access.';
    if (currentPlan === 'pro') return 'You already have Pro. Upgrade to Max for the full catalog.';
    return 'Choose the plan that unlocks the content pace you want.';
  }, [currentPlan]);

  const startCheckout = async (plan: 'pro' | 'max') => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoadingPlan(plan);
    setError(null);
    try {
      const session = await apiService.createCheckoutSession(plan);
      window.location.href = session.checkoutUrl;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to start checkout right now.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px 56px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '28px 30px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(233,30,140,0.08), rgba(12,18,28,0.96))',
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 10, textTransform: 'uppercase' }}>
                Premium access
              </div>
              <h1 style={{ fontSize: '2rem', lineHeight: 1.1, margin: 0, fontWeight: 900 }}>Free, Pro, and Max</h1>
              <p style={{ color: 'var(--text-muted)', maxWidth: 620, margin: '12px 0 0' }}>{subtitle}</p>
            </div>
            <div
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '12px 16px',
                minWidth: 180,
                background: 'rgba(8,12,18,0.45)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: 6 }}>
                Current plan
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{currentPlan.toUpperCase()}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Stripe checkout powers paid upgrades.
              </div>
            </div>
          </div>
        </motion.div>

        {banner && (
          <div
            style={{
              border: '1px solid rgba(0,212,170,0.28)',
              background: 'rgba(0,212,170,0.08)',
              color: '#7CE7D0',
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 16,
            }}
          >
            {banner}
          </div>
        )}

        {error && (
          <div
            style={{
              border: '1px solid rgba(233,30,140,0.28)',
              background: 'rgba(233,30,140,0.08)',
              color: '#F4A0CC',
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.key;
            const isPaid = plan.key !== 'free';
            const isUpgradeBlocked = currentPlan === 'max' || currentPlan === plan.key;

            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{
                  padding: 24,
                  border: `1px solid ${isCurrent ? 'rgba(0,212,170,0.45)' : `${plan.accent}40`}`,
                  background: `linear-gradient(180deg, ${plan.accent}12, rgba(13,18,28,0.98))`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: plan.accent, fontWeight: 700, marginBottom: 10 }}>
                      <Icon size={18} />
                      <span>{plan.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: '2.2rem', fontWeight: 900 }}>{plan.price}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{plan.cadence}</span>
                    </div>
                  </div>
                  {isCurrent && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: '#7CE7D0',
                        background: 'rgba(0,212,170,0.12)',
                        border: '1px solid rgba(0,212,170,0.28)',
                        borderRadius: 999,
                        padding: '5px 10px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Current
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
                  {plan.benefits.map((benefit) => (
                    <div key={benefit} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Check size={16} style={{ color: '#00D4AA', marginTop: 2, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{benefit}</span>
                    </div>
                  ))}
                </div>

                {isPaid ? (
                  <button
                    className="btn"
                    disabled={loadingPlan !== null || isUpgradeBlocked}
                    onClick={() => startCheckout(plan.key as 'pro' | 'max')}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      background: isUpgradeBlocked ? 'rgba(148,163,184,0.16)' : `linear-gradient(135deg, ${plan.accent}, ${plan.accent}CC)`,
                      color: isUpgradeBlocked ? 'var(--text-muted)' : '#111827',
                      border: 'none',
                      cursor: isUpgradeBlocked ? 'default' : 'pointer',
                      fontWeight: 800,
                    }}
                  >
                    {loadingPlan === plan.key ? 'Redirecting to Stripe...' : isUpgradeBlocked ? 'Already included' : plan.cta}
                  </button>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'center',
                      borderRadius: 8,
                      border: '1px solid rgba(148,163,184,0.25)',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                    }}
                  >
                    {plan.cta}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div style={{ marginTop: 22, color: 'var(--text-subtle)', fontSize: '0.82rem', lineHeight: 1.6 }}>
          Paid plan changes are finalized by the Stripe webhook after checkout. Set `STRIPE_SECRET_KEY`,
          `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, and `STRIPE_MAX_PRICE_ID` on the backend before going live.
        </div>
      </div>
    </div>
  );
}
