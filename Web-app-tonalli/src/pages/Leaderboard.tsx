import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, MapPin, Crown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useT } from '../hooks/useT';
import type { LeaderboardEntry, WeeklyLeaderboard } from '../types';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_EMOJIS = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];

type Tab = 'global' | 'weekly' | 'city';

export function Leaderboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const t = useT();
  const [tab, setTab] = useState<Tab>('global');
  const [globalData, setGlobalData] = useState<LeaderboardEntry[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyLeaderboard | null>(null);
  const [cityData, setCityData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyError, setWeeklyError] = useState('');
  const [demoResult, setDemoResult] = useState<any>(null);
  const [demoing, setDemoing] = useState(false);

  const handleDemoDistribute = async () => {
    setDemoing(true);
    try {
      const result = await apiService.demoPodiumDistribute();
      setDemoResult(result);
      // Refresh weekly data after distribution
      const data = await apiService.getWeeklyPodium();
      setWeeklyData(data);
    } catch (err: any) {
      console.error(err);
      setDemoResult({ message: 'Error: ' + (err.response?.data?.message || err.message) });
    }
    setDemoing(false);
  };

  useEffect(() => {
    if (user?.plan !== 'free') loadData();
  }, [tab, user?.plan]);

  // Plan gate — show upsell screen for free users
  if (user?.plan === 'free') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '48px 36px',
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🏆</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 12, color: 'var(--text)' }}>
            {t('weeklyPodium')}
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 32 }}>
            El ranking semanal es exclusivo para usuarios Pro y Max. Mejora tu plan para competir por premios reales en XLM.
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 32, padding: '12px 20px',
            background: 'rgba(255,215,0,0.08)',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 12,
          }}>
            <Lock size={16} color="#FFD700" />
            <span style={{ fontSize: '0.85rem', color: '#FFD700', fontWeight: 600 }}>
              Exclusivo para planes Pro y Max
            </span>
          </div>
          <button
            onClick={() => navigate('/premium')}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #F5A623, #E91E8C)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            {t('seePremiumPlans')}
          </button>
        </motion.div>
      </div>
    );
  }

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'global') {
        const data = await apiService.getLeaderboard();
        setGlobalData(data);
      } else if (tab === 'weekly') {
        try {
          const data = await apiService.getWeeklyPodium();
          setWeeklyData(data);
          setWeeklyError('');
        } catch (err: any) {
          setWeeklyError(err.response?.data?.message || t('onlyPremiumUsers'));
        }
      } else if (tab === 'city') {
        const city = user?.city || 'Ciudad de México';
        const data = await apiService.getCityLeaderboard(city);
        setCityData(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const renderEntry = (entry: LeaderboardEntry, i: number) => (
    <motion.div
      key={entry.userId || i}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.04 }}
      style={{
        background: entry.isCurrentUser ? 'rgba(255,107,53,0.15)' : 'var(--card)',
        border: `1px solid ${entry.isCurrentUser ? 'rgba(255,107,53,0.4)' : 'var(--border)'}`,
        borderRadius: 14,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: i < 3 ? `${MEDAL_COLORS[i]}25` : 'var(--border)',
        border: i < 3 ? `2px solid ${MEDAL_COLORS[i]}` : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: i < 3 ? '1.2rem' : '0.9rem',
        color: i < 3 ? MEDAL_COLORS[i] : 'var(--text-muted)',
        flexShrink: 0,
      }}>
        {i < 3 ? MEDAL_EMOJIS[i] : entry.rank}
      </div>

      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: `hsl(${(entry.rank || i) * 37}deg, 60%, 40%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: '1rem', color: 'white', flexShrink: 0,
      }}>
        {(entry.displayName || entry.username || '?').charAt(0)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 900, fontSize: '0.95rem' }}>{entry.displayName || entry.username}</span>
          {entry.plan && entry.plan !== 'free' && <Crown size={14} color="#FFD700" />}
          {entry.isCurrentUser && (
            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{t('you')}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={11} />{entry.city}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
        {entry.streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
            <Flame size={14} color="#FF6B35" />
            <span style={{ fontWeight: 700, color: '#FF6B35' }}>{entry.streak}</span>
          </div>
        )}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 900, color: 'var(--accent)', fontSize: '1rem' }}>
            <Zap size={14} />
            {(entry.xp || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>XP</div>
        </div>
      </div>
    </motion.div>
  );

  const entries = tab === 'global' ? globalData : tab === 'city' ? cityData : (weeklyData?.rankings || []);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,107,53,0.1))',
        borderBottom: '1px solid var(--border)',
        padding: '40px 24px 20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: 12 }}>{'\uD83C\uDFC6'}</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>{t('leaderboard')}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{t('bestStudents')}</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          {[
            { key: 'global' as Tab, label: t('tabGlobal'), icon: '\uD83C\uDF0D' },
            { key: 'weekly' as Tab, label: t('tabWeeklyPodium'), icon: '\u2B50' },
            { key: 'city' as Tab, label: `${user?.city || t('profile')}`, icon: '\uD83D\uDCCD' },
          ].map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: tab === tabItem.key ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: tab === tabItem.key ? 'rgba(255,215,0,0.15)' : 'transparent',
                color: tab === tabItem.key ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: tab === tabItem.key ? 700 : 400,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {tabItem.icon} {tabItem.label}
            </button>
          ))}
        </div>

        {/* Weekly rewards info */}
        {tab === 'weekly' && weeklyData && (
          <div style={{
            marginTop: 16,
            display: 'flex', gap: 12, justifyContent: 'center',
            fontSize: '0.85rem',
          }}>
            <span style={{ color: '#FFD700' }}>{'\uD83E\uDD47'} ${weeklyData.rewards.first} USD</span>
            <span style={{ color: '#C0C0C0' }}>{'\uD83E\uDD48'} ${weeklyData.rewards.second} USD</span>
            <span style={{ color: '#CD7F32' }}>{'\uD83E\uDD49'} ${weeklyData.rewards.third} USD</span>
          </div>
        )}
      </div>

      <div className="container" style={{ padding: '24px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto' }} />
          </div>
        ) : tab === 'weekly' && weeklyError ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Lock size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{t('exclusivePremiumPodium')}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{weeklyError}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {t('getPremiumForRewards')}
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            {t('noRankingData')}
          </div>
        ) : (
          <>
            {/* Top 3 visual podium */}
            {entries.length >= 3 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16, marginBottom: 40 }}>
                {[1, 0, 2].map((pos) => {
                  const e = entries[pos];
                  if (!e) return null;
                  const heights = [160, 120, 100];
                  return (
                    <motion.div
                      key={pos}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: pos * 0.1 }}
                      style={{ textAlign: 'center', flex: 1, maxWidth: pos === 0 ? 200 : 180 }}
                    >
                      <div style={{ fontSize: pos === 0 ? '3rem' : '2.5rem', marginBottom: 8 }}>
                        {(e.displayName || e.username || '?').charAt(0)}
                      </div>
                      <div style={{ fontWeight: 900, fontSize: '0.9rem', marginBottom: 4 }}>
                        {e.displayName || e.username}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <MapPin size={11} />{e.city}
                      </div>
                      <div style={{
                        background: `${MEDAL_COLORS[pos]}40`,
                        border: `2px solid ${MEDAL_COLORS[pos]}`,
                        borderRadius: '12px 12px 0 0',
                        padding: '20px 12px 12px',
                        height: heights[pos],
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                      }}>
                        <div style={{ fontSize: pos === 0 ? '2rem' : '1.5rem', marginBottom: 4 }}>
                          {MEDAL_EMOJIS[pos]}
                        </div>
                        <div style={{ fontWeight: 900, color: MEDAL_COLORS[pos], fontSize: pos === 0 ? '1.3rem' : '1.1rem' }}>
                          {(e.xp || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>XP</div>
                        {tab === 'weekly' && (
                          <div style={{ fontSize: '0.75rem', color: MEDAL_COLORS[pos], marginTop: 4, fontWeight: 700 }}>
                            ${[15, 10, 5][pos]} USD
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {entries.map((e, i) => renderEntry({
                ...e,
                rank: e.rank || i + 1,
                isCurrentUser: e.userId === user?.id || (e as any).isCurrentUser,
              }, i))}
            </div>
          </>
        )}

        {/* Demo: Distribute Podium Rewards */}
        {tab === 'weekly' && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button
              onClick={handleDemoDistribute}
              disabled={demoing}
              style={{
                padding: '14px 32px',
                borderRadius: 14,
                border: '2px solid #FFD700',
                background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,107,53,0.2))',
                color: '#FFD700',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: demoing ? 'not-allowed' : 'pointer',
                opacity: demoing ? 0.6 : 1,
              }}
            >
              {demoing ? 'Distribuyendo...' : '🏆 Demo: Distribuir Recompensas del Podio'}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Simula el cierre semanal: envía XLM + mintea Podium NFTs via Smart Contracts
            </p>

            {demoResult && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 20,
                  background: 'rgba(0,212,170,0.08)',
                  border: '1px solid rgba(0,212,170,0.3)',
                  borderRadius: 16,
                  padding: '20px 24px',
                  textAlign: 'left',
                }}
              >
                <h4 style={{ fontWeight: 800, color: '#00D4AA', marginBottom: 12, fontSize: '1rem' }}>
                  {demoResult.message}
                </h4>
                {demoResult.winners?.map((w: any) => (
                  <div key={w.position} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {w.position === 1 ? '🥇' : w.position === 2 ? '🥈' : '🥉'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        Posición {w.position} — ${w.rewardUsd} USD ({w.rewardXlm} XLM)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Status: <span style={{ color: w.status === 'paid' ? '#00D4AA' : '#F5A623' }}>{w.status}</span>
                      </div>
                      {w.txHash && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          XLM TX: <code style={{ color: '#E91E8C' }}>{w.txHash.slice(0, 16)}...</code>
                        </div>
                      )}
                      {w.nftTxHash && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          NFT TX: <code style={{ color: '#F5A623' }}>{w.nftTxHash.slice(0, 16)}...</code>
                          {' '}
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${w.nftTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#00D4AA', textDecoration: 'underline', fontSize: '0.7rem' }}
                          >
                            Ver en Stellar
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {demoResult.winners && (
                  <div style={{
                    marginTop: 16, padding: '12px 16px',
                    background: 'rgba(245,166,35,0.08)',
                    border: '1px solid rgba(245,166,35,0.2)',
                    borderRadius: 10,
                    fontSize: '0.75rem', color: '#F5A623',
                  }}>
                    <strong>Smart Contracts usados:</strong><br />
                    1. <code>learn-to-earn</code> → Envío de XLM via Stellar<br />
                    2. <code>podio-nft</code> → Mint de NFT conmemorativo en Soroban
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* Bottom message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ textAlign: 'center', marginTop: 40, padding: '32px 24px' }}
        >
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: 12 }}>{'\uD83C\uDFB8'}</span>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            <strong style={{ color: 'var(--text)' }}>{t('alliSays')}</strong> {t('alliQuote')}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
