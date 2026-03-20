import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Trophy, Lock, CheckCircle, PlayCircle, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { apiService } from '../services/api';
import type { Module, Lesson, LeaderboardEntry } from '../types';

function LessonNode({ lesson, index }: { lesson: Lesson; index: number }) {
  const isLeft = index % 2 === 0;

  const bgColor = lesson.status === 'completed'
    ? 'var(--success)'
    : lesson.status === 'available'
    ? 'var(--primary)'
    : 'var(--border)';

  const icon = lesson.status === 'completed'
    ? <CheckCircle size={28} color="white" />
    : lesson.status === 'available'
    ? <PlayCircle size={28} color="white" />
    : <Lock size={24} color="var(--text-muted)" />;

  const content = (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      style={{ display: 'flex', alignItems: 'center', gap: 16, maxWidth: 280 }}
    >
      <div style={{
        flex: 1,
        background: 'var(--card)',
        border: `1px solid ${lesson.status === 'available' ? 'rgba(46,139,63,0.4)' : 'var(--border)'}`,
        borderRadius: 14,
        padding: '14px 18px',
        opacity: lesson.status === 'locked' ? 0.5 : 1,
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          {lesson.type === 'quiz' ? '\uD83D\uDCDD Quiz' : '\uD83D\uDCD6 Leccion'}
        </div>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 6 }}>{lesson.title}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>+{lesson.xpReward} XP</span>
          {lesson.xlmReward > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>+{lesson.xlmReward} XLM</span>}
        </div>
      </div>
    </motion.div>
  );

  const nodeButton = lesson.status !== 'locked' ? (
    <Link to={`/learn/${lesson.id}`} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: lesson.status === 'available' ? '0 0 0 6px rgba(46,139,63,0.2), 0 0 0 12px rgba(46,139,63,0.1)' : 'none',
          flexShrink: 0,
          cursor: 'pointer',
          border: '3px solid rgba(255,255,255,0.1)',
        }}
        className={lesson.status === 'available' ? 'pulse-glow' : ''}
      >
        {icon}
      </motion.div>
    </Link>
  ) : (
    <div style={{
      width: 64, height: 64, borderRadius: '50%',
      background: 'var(--card)', border: '3px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {icon}
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0,
      flexDirection: isLeft ? 'row' : 'row-reverse',
    }}>
      <div style={{ width: 280, display: 'flex', justifyContent: isLeft ? 'flex-end' : 'flex-start' }}>
        {content}
      </div>
      <div style={{ width: 80, display: 'flex', justifyContent: 'center', position: 'relative' }}>
        {nodeButton}
      </div>
      <div style={{ width: 280 }} />
    </div>
  );
}

function ModuleSection({ module }: { module: Module }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          margin: '32px 0 24px',
        }}
      >
        <div style={{ height: 2, flex: 1, maxWidth: 120, background: 'var(--border)' }} />
        <div style={{
          background: module.status === 'locked' ? 'var(--card)' : module.color + '20',
          border: `2px solid ${module.status === 'locked' ? 'var(--border)' : module.color}`,
          borderRadius: 40,
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          opacity: module.status === 'locked' ? 0.5 : 1,
        }}>
          <span style={{ fontSize: '1.5rem' }}>{module.icon}</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>{module.title}</div>
            {module.status === 'locked' && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Requiere {module.xpRequired} XP</div>
            )}
          </div>
        </div>
        <div style={{ height: 2, flex: 1, maxWidth: 120, background: 'var(--border)' }} />
      </motion.div>

      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${module.color}40, var(--border))`,
          transform: 'translateX(-50%)',
          zIndex: 0,
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', zIndex: 1 }}>
          {module.lessons.map((lesson, i) => (
            <LessonNode key={lesson.id} lesson={lesson} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user, setUser } = useAuthStore();
  const { modules, loadModules, completedLessons, dailyStreak } = useProgressStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadModules();

    // Load real profile data
    apiService.getProfile().then((profile) => {
      if (user) {
        setUser({
          ...user,
          xp: profile.xp || 0,
          level: Math.floor((profile.totalXp || profile.xp || 0) / 500) + 1,
          streak: (profile as any).currentStreak || profile.streak || 0,
          walletAddress: profile.walletAddress || '',
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

  // Find first available lesson for daily challenge
  const firstAvailable = modules.flatMap((m) => m.lessons).find((l) => l.status === 'available');

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
                  src={`/characters/${'chima'}.png`}
                  alt={user.username}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 900 }}>Hola, {user.username}!</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nivel {level} · {user.city}</div>
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
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>dias seguidos</div>
              </div>

              {/* XP */}
              <div style={{ minWidth: 140 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap size={12} color="#FFD700" /> {totalXp} XP
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Niv. {level + 1}: {xpToNextLevel}</span>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className="progress-fill" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>

              {/* XLM */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent)' }}>{user.xlmEarned || 0} XLM</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ganados</div>
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
            {firstAvailable && (
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
                    <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>Desafio Diario</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Completa 1 leccion hoy para mantener tu racha</div>
                  </div>
                </div>
                <Link to={`/learn/${firstAvailable.id}`} className="btn btn-primary">
                  Acepto el reto! <ChevronRight size={16} />
                </Link>
              </motion.div>
            )}

            {/* Module path */}
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 8, textAlign: 'center' }}>Tu camino de aprendizaje</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16, fontSize: '0.9rem' }}>
              {completedLessons.length} lecciones completadas
            </p>

            {modules.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                Cargando modulos...
              </div>
            )}

            {modules.map((module) => (
              <ModuleSection key={module.id} module={module} />
            ))}
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
                {streak > 0 ? `${streak} dias seguidos!` : 'Empieza tu racha!'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
                {streak > 0 ? 'Xollo esta muy orgulloso de ti' : 'Completa una leccion para que Xollo este feliz'}
              </div>
              <div style={{
                background: streak > 0 ? 'rgba(46,139,63,0.15)' : 'rgba(155,89,182,0.15)',
                borderRadius: 8, padding: '8px 12px',
                fontSize: '0.85rem', fontWeight: 700,
                color: streak > 0 ? 'var(--primary)' : '#9B59B6',
              }}>
                {streak > 0 ? 'Racha activa' : 'Sin racha'}
              </div>
            </motion.div>

            {/* Wallet card */}
            {user.walletAddress && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <div style={{ fontWeight: 900, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Stellar Wallet
                </div>
                <div style={{
                  background: 'var(--background)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  color: 'var(--text-muted)',
                  wordBreak: 'break-all',
                }}>
                  {user.walletAddress}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Red: Stellar Testnet
                </div>
              </motion.div>
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
                  Ver todo
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {leaderboard.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: 12 }}>
                    Se el primero en el ranking!
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
                  Mis NFTs
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
                  Ver todos
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
