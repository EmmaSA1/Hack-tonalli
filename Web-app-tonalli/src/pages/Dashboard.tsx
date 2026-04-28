import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Trophy, Lock, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { apiService } from '../services/api';
import type { LeaderboardEntry } from '../types';
import { useT } from '../hooks/useT';
import { WalletPanel } from '../components/WalletPanel';



export function Dashboard() {
  const { user, setUser } = useAuthStore();
  const { loadModules, dailyStreak } = useProgressStore();
  const t = useT();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);

  useEffect(() => {
    loadModules();
    apiService.getChapters().then(setChapters).catch(() => {});

    // Load real profile data
    apiService.getProfile().then((profile) => {
      if (user) {
        setUser({
          ...user,
          xp: profile.xp || 0,
          level: Math.floor((profile.totalXp || profile.xp || 0) / 500) + 1,
          streak: (profile as any).currentStreak || profile.streak || 0,
          walletAddress: profile.walletAddress || '',
          externalWalletAddress: profile.externalWalletAddress || null,
          walletType: profile.walletType || 'custodial',
        });
      }
    }).catch(() => {});

    // Load real leaderboard
    apiService.getLeaderboard().then((data) => {
      const entries: LeaderboardEntry[] = (data || []).map((entry: any, i: number) => ({
        rank: entry.rank || i + 1,
        userId: entry.username,
        username: entry.displayName || entry.username,
        city: entry.city || 'Mexico',
        xp: entry.xp || 0,
        level: Math.floor((entry.xp || 0) / 500) + 1,
        streak: entry.streak || 0,
        isCurrentUser: user ? entry.username === user.username : false,
      }));
      setLeaderboard(entries);
    }).catch(() => {});
  }, []);

  if (!user) return null;

  const totalXp = user.xp || 0;
  const level = Math.floor(totalXp / 500) + 1;
  const xpToNextLevel = level * 500;
  const xpProgress = ((totalXp % 500) / 500) * 100;
  const streak = user.streak || dailyStreak || 0;

  // Find first accessible chapter for daily challenge
  const firstAvailableChapter = chapters.find((c: any) => c.accessible !== false);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Top bar */}
      <div style={{
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid var(--primary)',
              }}>
                <img
                  src={`/characters/${
                    user.avatarType === 'mariachi_hombre' ? 'alli' :
                    user.avatarType === 'mariachi_mujer'  ? 'chima' :
                    user.companion || 'chima'
                  }.png`}
                  alt={user.username}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 900 }}>{t('hello')}, {user.username}!</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('level')} {level} · {user.city}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Streak */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {streak > 0 ? (
                    <img src="/characters/xollo.png" alt="Xollo" style={{ width: 28, height: 28, objectFit: 'contain' }} className="streak-fire" />
                  ) : (
                    <img src="/characters/xollo.png" alt="Xollo" style={{ width: 28, height: 28, objectFit: 'contain', opacity: 0.4 }} />
                  )}
                  <span style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--primary)' }}>{streak}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('daysStreak')}</div>
              </div>

              {/* XP */}
              <div style={{ minWidth: 140 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap size={12} color="#FFD700" /> {totalXp} XP
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('levelShort')} {level + 1}: {xpToNextLevel}</span>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className="progress-fill" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>

              {/* XLM */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent)' }}>{user.xlmEarned || 0} XLM</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('earned')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          {/* Main path */}
          <div>
            {/* Daily challenge */}
            {firstAvailableChapter && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{
                  marginBottom: 32,
                  background: 'linear-gradient(135deg, rgba(46,139,63,0.2), rgba(245,197,24,0.1))',
                  border: '1px solid rgba(46,139,63,0.4)',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img src="/characters/xollo.png" alt="Xollo" style={{ width: 50, height: 50, objectFit: 'contain' }} className="float-animation" />
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{t('dailyChallenge')}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('completeModule')}</div>
                  </div>
                </div>
                <Link to={`/chapters/${firstAvailableChapter.moduleTag || firstAvailableChapter.id}`} className="btn btn-primary">
                  {t('acceptChallenge')} <ChevronRight size={16} />
                </Link>
              </motion.div>
            )}

            {/* Chapters path */}
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 8, textAlign: 'center' }}>{t('learningPath')}</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: 24, fontSize: '0.9rem' }}>
              {chapters.filter((c: any) => c.accessible).length} {t('chaptersAvailableOf')} {chapters.length} {t('chaptersAvailableCount')}
              {user?.plan === 'free' && <span style={{ color: '#f59e0b' }}> · {t('freePlanLimit')}</span>}
            </p>

            {chapters.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                {t('loadingChaptersAlt')}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chapters.map((ch: any, i: number) => (
                <motion.div
                  key={ch.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    to={ch.accessible !== false ? `/chapters/${ch.moduleTag || ch.id}` : '#'}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    onClick={(e) => { if (ch.accessible === false) e.preventDefault(); }}
                  >
                    <div
                      className="card"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                        opacity: ch.accessible === false ? 0.45 : 1,
                        cursor: ch.accessible === false ? 'not-allowed' : 'pointer',
                        border: ch.accessible === false ? '1px solid var(--border)' : '1px solid rgba(46,139,63,0.3)',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      {/* Number / lock */}
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: ch.accessible === false
                          ? 'var(--border)'
                          : 'linear-gradient(135deg, var(--primary), var(--accent))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '1.1rem', color: ch.accessible === false ? 'var(--text-muted)' : '#fff',
                        flexShrink: 0,
                      }}>
                        {ch.accessible === false ? <Lock size={20} /> : ch.order}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 2 }}>{ch.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {ch.moduleTag && <span style={{ color: 'var(--accent)' }}>{ch.moduleTag}</span>}
                          <span>{ch.estimatedMinutes || 15} min</span>
                          <span>+{ch.xpReward} XP</span>
                          {ch.releaseWeek && <span>{t('weekLabel')} {ch.releaseWeek}</span>}
                        </div>
                        {ch.accessible === false && (
                          <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 4 }}>
                            {ch.lockedReason === 'requires_max'
                              ? 'Upgrade to Max to unlock this chapter.'
                              : ch.lockedReason === 'requires_pro'
                                ? 'Upgrade to Pro or Max to unlock this chapter.'
                                : t('comingSoon')}
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      {ch.accessible !== false && (
                        <ChevronRight size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Xollo streak card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card"
              style={{ textAlign: 'center', padding: 24, border: '1px solid rgba(46,139,63,0.3)' }}
            >
              <img
                src="/characters/xollo.png"
                alt="Xollo"
                className="float-animation"
                style={{ width: 80, height: 80, objectFit: 'contain', margin: '0 auto 12px', display: 'block' }}
              />
              <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 4 }}>
                {streak > 0 ? `${streak} ${t('daysStreak')}!` : t('startYourStreak')}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
                {streak > 0 ? t('xolloProud') : t('xolloHappy')}
              </div>
              <div style={{
                background: streak > 0 ? 'rgba(46,139,63,0.15)' : 'rgba(155,89,182,0.15)',
                borderRadius: 8, padding: '8px 12px',
                fontSize: '0.85rem', fontWeight: 700,
                color: streak > 0 ? 'var(--primary)' : '#9B59B6',
              }}>
                {streak > 0 ? t('activeStreak') : t('noStreak')}
              </div>
            </motion.div>

            {/* Wallet panel */}
            {user.walletAddress && (
              <WalletPanel
                walletAddress={user.walletAddress}
                externalWalletAddress={user.externalWalletAddress}
                walletType={user.walletType}
                onWalletUpdate={() => {
                  apiService.getProfile().then((profile) => {
                    setUser({ ...user, ...profile });
                  }).catch(() => {});
                }}
              />
            )}

            {/* Leaderboard mini */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Trophy size={18} color="var(--accent)" /> Ranking
                </div>
                <Link to="/leaderboard" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>
                  {t('seeAll')}
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {leaderboard.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: 12 }}>
                    {t('beFirstOnLeaderboard')}
                  </div>
                )}
                {leaderboard.slice(0, 5).map((entry) => (
                  <div key={entry.userId} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px',
                    background: entry.isCurrentUser ? 'rgba(46,139,63,0.15)' : 'transparent',
                    borderRadius: 10,
                    border: entry.isCurrentUser ? '1px solid rgba(46,139,63,0.3)' : '1px solid transparent',
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: entry.rank <= 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][entry.rank - 1] : 'var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 900,
                      color: entry.rank <= 3 ? '#1A1A2E' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}>
                      {entry.rank}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.username}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{entry.city}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>{entry.xp.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* NFT Preview */}
            {user.nftCertificates && user.nftCertificates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card"
              >
                <div style={{ fontWeight: 900, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {t('myNfts')}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {user.nftCertificates.slice(0, 2).map((nft) => (
                    <div key={nft.id} style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, rgba(155,89,182,0.2), rgba(46,139,63,0.2))',
                      border: '1px solid rgba(155,89,182,0.4)',
                      borderRadius: 12,
                      padding: 12,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: 6 }}>NFT</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text)' }}>{nft.title}</div>
                    </div>
                  ))}
                </div>
                <Link to="/profile" style={{ display: 'block', textAlign: 'center', marginTop: 10, color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                  {t('seeAllNfts')}
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
