import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Flame, Star, BookOpen, Award, Copy, ExternalLink, Trophy, Wallet, LogOut, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { Link } from 'react-router-dom';
import { useT } from '../hooks/useT';
import { useFreighter } from '../hooks/useFreighter';
import { apiService } from '../services/api';
import type { PodiumNFT } from '../types';

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="card"
      style={{ textAlign: 'center', padding: '24px 16px' }}
    >
      <div style={{ color, marginBottom: 8, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
    </motion.div>
  );
}

function NFTCard({ nft }: { nft: { id: string; title: string; description: string; txHash: string; earnedAt: string; moduleId: string } }) {
  const t = useT();
  const shortHash = `${nft.txHash.substring(0, 8)}...${nft.txHash.substring(nft.txHash.length - 8)}`;

  const copyHash = () => {
    navigator.clipboard.writeText(nft.txHash);
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      style={{
        background: 'linear-gradient(135deg, rgba(155,89,182,0.3), rgba(255,107,53,0.2))',
        border: '1px solid rgba(155,89,182,0.4)',
        borderRadius: 16,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Shine effect */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
        borderRadius: '16px 16px 0 0',
      }} />

      {/* NFT image placeholder */}
      <div style={{
        width: '100%', paddingBottom: '100%',
        background: 'linear-gradient(135deg, #9B59B6, #FF6B35)',
        borderRadius: 12,
        marginBottom: 16,
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}>🏆</span>
        </div>
      </div>

      <div className="badge badge-purple" style={{ marginBottom: 8 }}>{t('nftCertified')}</div>
      <h3 style={{ fontWeight: 900, fontSize: '1rem', marginBottom: 6 }}>{nft.title}</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{nft.description}</p>

      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>{t('stellarTxHash')}</div>
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 8, padding: '8px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {shortHash}
        </span>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={copyHash} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
            <Copy size={14} />
          </button>
          <a href={`https://stellar.expert/explorer/public/tx/${nft.txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        {t('obtainedOn')} {new Date(nft.earnedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </motion.div>
  );
}

const PODIUM_EMOJIS = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
const PODIUM_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

function PodiumTrophyCard({ nft }: { nft: PodiumNFT }) {
  const t = useT();
  const posIndex = nft.position - 1;
  const emoji = PODIUM_EMOJIS[posIndex] || '\uD83C\uDFC6';
  const color = PODIUM_COLORS[posIndex] || '#FFD700';

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      style={{
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        border: `1px solid ${color}60`,
        borderRadius: 16,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
        borderRadius: '16px 16px 0 0',
      }} />

      <div style={{ fontSize: '3.5rem', marginBottom: 12, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}>
        {emoji}
      </div>

      <div style={{
        display: 'inline-block',
        padding: '3px 12px', borderRadius: 20,
        background: `${color}30`, border: `1px solid ${color}`,
        fontSize: '0.75rem', fontWeight: 800, color,
        marginBottom: 10,
      }}>
        {nft.position === 1 ? '1er Lugar' : nft.position === 2 ? '2do Lugar' : '3er Lugar'}
      </div>

      <h3 style={{ fontWeight: 900, fontSize: '1rem', marginBottom: 4 }}>
        Semana {nft.week}
      </h3>
      <p style={{ fontSize: '0.85rem', color, fontWeight: 700, marginBottom: 8 }}>
        +{nft.rewardXlm} XLM (${nft.rewardUsd} USD)
      </p>

      {nft.nftTxHash && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 8, padding: '6px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          marginTop: 8,
        }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            NFT: {nft.nftTxHash.substring(0, 8)}...
          </span>
          {nft.stellarExplorerUrl && (
            <a href={nft.stellarExplorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        {new Date(nft.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </motion.div>
  );
}

export function Profile() {
  const { user, setUser } = useAuthStore();
  const { dailyStreak, completedLessons } = useProgressStore();
  const t = useT();
  const freighter = useFreighter();
  const [podiumNfts, setPodiumNfts] = useState<PodiumNFT[]>([]);
  const [actaCerts, setActaCerts] = useState<any[]>([]);
  const [walletBalances, setWalletBalances] = useState<{ xlm: string; tnl: number } | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  const fetchWalletData = async () => {
    try {
      setLoadingWallet(true);
      const data = await apiService.getWalletBalance();
      setWalletBalances({
        xlm: data.xlmBalance,
        tnl: data.tnlBalance,
      });
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoadingWallet(false);
    }
  };

  useEffect(() => {
    if (user) {
      apiService.getPodiumNfts().then(setPodiumNfts).catch(() => {});
      apiService.getCertificates().then(setActaCerts).catch(() => {});
      fetchWalletData();
    }
  }, [user]);

  const handleConnectFreighter = async () => {
    const address = await freighter.connect();
    if (address) {
      try {
        const res = await apiService.connectWallet(address);
        if (user) {
          setUser({
            ...user,
            externalWalletAddress: res.externalWalletAddress,
            walletType: res.walletType,
          });
        }
      } catch (err) {
        console.error('Error connecting wallet:', err);
      }
    }
  };

  const handleDisconnectFreighter = async () => {
    try {
      const res = await apiService.disconnectWallet();
      if (user) {
        setUser({
          ...user,
          externalWalletAddress: null,
          walletType: res.walletType,
        });
      }
      freighter.disconnect();
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Link to="/login" className="btn btn-primary">{t('loginBtn')}</Link>
      </div>
    );
  }

  const xpToNextLevel = user.level * 500;
  const currentLevelXP = (user.level - 1) * 500;
  const xpProgress = ((user.xp - currentLevelXP) / (xpToNextLevel - currentLevelXP)) * 100;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1A1A2E 0%, #2D1B4E 50%, #1A2E1A 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '40px 24px 60px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.7 }}
          style={{ position: 'relative' }}
        >
          {/* Avatar */}
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B35, #FFD700)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: 900, color: 'white',
            margin: '0 auto 16px',
            border: '4px solid rgba(255,107,53,0.5)',
            boxShadow: '0 0 30px rgba(255,107,53,0.4)',
          }}>
            {user.username.charAt(0).toUpperCase()}
          </div>

          {/* Level badge */}
          <div style={{
            position: 'absolute', bottom: 12, right: 'calc(50% - 60px)',
            background: 'var(--primary)',
            color: 'white', fontWeight: 900, fontSize: '0.75rem',
            padding: '3px 10px', borderRadius: 20,
            border: '2px solid var(--background)',
          }}>
            {t('levelBadge')} {user.level}
          </div>
        </motion.div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 4 }}>{user.username}</h1>
        <div style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.9rem' }}>
          📍 {user.city} · {user.email}
        </div>

        {user.walletAddress && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: 20, padding: '6px 14px', fontSize: '0.75rem',
              }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 8, fontSize: '0.65rem', fontWeight: 800,
                  background: user.walletType === 'hybrid' ? 'rgba(46,139,63,0.3)' : 'rgba(155,89,182,0.3)',
                  color: user.walletType === 'hybrid' ? '#2E8B3F' : '#9B59B6',
                }}>
                  {user.walletType === 'hybrid' ? 'HIBRIDA' : 'CUSTODIAL'}
                </span>
                <span style={{ fontFamily: 'monospace' }}>
                  {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)}
                </span>
              </div>

              {user.externalWalletAddress && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(46,139,63,0.1)', border: '1px solid rgba(46,139,63,0.3)',
                  borderRadius: 20, padding: '6px 14px', fontSize: '0.75rem', color: '#2E8B3F',
                }}>
                  <Wallet size={14} />
                  <span style={{ fontFamily: 'monospace' }}>
                    {user.externalWalletAddress.substring(0, 6)}...{user.externalWalletAddress.substring(user.externalWalletAddress.length - 4)}
                  </span>
                </div>
              )}
            </div>

            {/* Wallet Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              {user.walletType === 'custodial' ? (
                <button
                  onClick={handleConnectFreighter}
                  disabled={freighter.loading}
                  className="btn btn-sm"
                  style={{
                    background: 'rgba(255,107,53,0.2)',
                    border: '1px solid var(--primary)',
                    color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: '0.75rem', fontWeight: 800,
                  }}
                >
                  <LinkIcon size={14} /> {freighter.loading ? 'Conectando...' : 'Conectar Freighter'}
                </button>
              ) : (
                <button
                  onClick={handleDisconnectFreighter}
                  className="btn btn-sm"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: '0.75rem', fontWeight: 800,
                  }}
                >
                  <LogOut size={14} /> Desconectar Externa
                </button>
              )}

              <button
                onClick={fetchWalletData}
                disabled={loadingWallet}
                className="btn btn-sm"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.75rem', padding: '0 10px',
                }}
              >
                <RefreshCw size={14} className={loadingWallet ? 'spin' : ''} />
              </button>
            </div>

            {/* Balances Display */}
            {walletBalances && (
              <div style={{
                display: 'flex', gap: 20, marginTop: 8,
                fontSize: '0.85rem', fontWeight: 700,
                color: 'var(--text-muted)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#00C896' }}>{walletBalances.xlm}</span> XLM
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#FFD700' }}>{walletBalances.tnl}</span> TNL
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ marginBottom: 24, padding: '24px 28px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{t('progressToLevel').replace('{n}', String(user.level + 1))}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {user.xp.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)' }}>
              <Zap size={18} color="var(--accent)" />
              {(xpToNextLevel - user.xp).toLocaleString()} {t('xpToLevelUp')}
            </div>
          </div>
          <div className="progress-bar" style={{ height: 14 }}>
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(xpProgress, 100)}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              style={{ width: `${Math.min(xpProgress, 100)}%` }}
            />
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 32 }}
        >
          <StatCard icon={<Flame size={28} />} value={dailyStreak} label={`${t('streak')} (${t('days')})`} color="#FF6B35" />
          <StatCard icon={<Zap size={28} />} value={`${user.xp.toLocaleString()} XP`} label={t('totalXp')} color="#FFD700" />
          <StatCard icon={<Star size={28} />} value={`${user.xlmEarned} XLM`} label={t('xlmEarned')} color="#00C896" />
          <StatCard icon={<BookOpen size={28} />} value={completedLessons.length} label={t('completedModules')} color="#9B59B6" />
          <StatCard icon={<Award size={28} />} value={user.nftCertificates.length} label={t('nftBadges')} color="#3498DB" />
        </motion.div>

        {/* Streak section */}
        {dailyStreak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
            style={{
              marginBottom: 32,
              background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,215,0,0.1))',
              border: '1px solid rgba(255,107,53,0.3)',
              display: 'flex', alignItems: 'center', gap: 20, padding: '24px 28px', flexWrap: 'wrap',
            }}
          >
            <span className="float-animation" style={{ fontSize: '4rem', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}>🐕</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: 4 }}>
                {t('xolloHappyStreak').replace('{n}', String(dailyStreak))}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {t('streakMaintained').replace('{n}', String(dailyStreak))}
              </p>
            </div>
            <div style={{
              background: 'rgba(255,107,53,0.2)', borderRadius: 12, padding: '12px 20px', textAlign: 'center',
              border: '1px solid rgba(255,107,53,0.4)',
            }}>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--primary)' }}>🔥 {dailyStreak}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('activeDays')}</div>
            </div>
          </motion.div>
        )}

        {/* Podium Trophies */}
        {podiumNfts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{ marginBottom: 32 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={24} color="#FFD700" /> Trofeos del Podio
              </h2>
              <span className="badge badge-primary">{podiumNfts.length} {podiumNfts.length === 1 ? 'trofeo' : 'trofeos'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {podiumNfts.map((nft) => (
                <PodiumTrophyCard key={nft.id} nft={nft} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ACTA Certificates (on-chain verified) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={24} color="#9B59B6" /> Certificados ACTA
            </h2>
            <span className="badge badge-purple">{actaCerts.length} {actaCerts.length === 1 ? 'certificado' : 'certificados'}</span>
          </div>

          {actaCerts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {actaCerts.map((cert) => (
                <motion.div
                  key={cert.id}
                  whileHover={{ y: -4 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(155,89,182,0.15), rgba(245,166,35,0.1))',
                    border: '1px solid rgba(155,89,182,0.35)',
                    borderRadius: 16,
                    padding: 24,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top gradient bar */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #9B59B6, #F5A623, #00D4AA)' }} />

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 12,
                      background: 'linear-gradient(135deg, #9B59B6, #F5A623)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', flexShrink: 0,
                    }}>
                      {'\uD83C\uDFC6'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 900, fontSize: '1rem', marginBottom: 4 }}>{cert.chapterTitle}</h3>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700,
                          background: 'rgba(0,212,170,0.15)', color: '#00D4AA',
                          border: '1px solid rgba(0,212,170,0.3)',
                          padding: '2px 8px', borderRadius: 12,
                        }}>
                          {'\u2713'} Verificado on-chain
                        </span>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700,
                          background: 'rgba(245,166,35,0.15)', color: '#F5A623',
                          padding: '2px 8px', borderRadius: 12,
                        }}>
                          Calificacion: {cert.examScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTA VC ID */}
                  {cert.actaVcId && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ACTA Credential ID
                      </div>
                      <div style={{
                        background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '6px 10px',
                        fontSize: '0.72rem', fontFamily: 'monospace', color: '#E91E8C',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {cert.actaVcId}
                      </div>
                    </div>
                  )}

                  {/* Stellar TX Hash */}
                  {cert.txHash && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Stellar TX Hash
                      </div>
                      <div style={{
                        background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '6px 10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      }}>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#F5A623', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cert.txHash.substring(0, 12)}...{cert.txHash.substring(cert.txHash.length - 12)}
                        </span>
                        {cert.stellarExplorerUrl && (
                          <a
                            href={cert.stellarExplorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              color: '#00D4AA', fontSize: '0.7rem', fontWeight: 700,
                              textDecoration: 'none', flexShrink: 0,
                            }}
                          >
                            <ExternalLink size={12} /> Stellar
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: 12, borderTop: '1px solid rgba(155,89,182,0.2)',
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                  }}>
                    <span>
                      {new Date(cert.issuedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span style={{
                      color: cert.status === 'issued' ? '#00D4AA' : '#F5A623',
                      fontWeight: 700,
                    }}>
                      {cert.status === 'issued' ? '\u2713 Emitido' : 'Pendiente'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>{'\uD83C\uDFC6'}</div>
              <h3 style={{ marginBottom: 8 }}>{t('noCertificates')}</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.9rem' }}>
                Completa el examen final de un capitulo para obtener tu certificado ACTA verificable en Stellar
              </p>
              <Link to="/chapters" className="btn btn-primary">{t('startLearning')}</Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
