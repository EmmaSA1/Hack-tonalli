import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Zap, ChevronRight, X, Tag } from 'lucide-react';
import { apiService } from '../services/api';
import type { Chapter } from '../types';
import { useT } from '../hooks/useT';

const TAG_COLORS: Record<string, string> = {
  blockchain: 'var(--blue)',
  stellar:    'var(--success)',
  defi:       'var(--purple)',
  nft:        '#e879f9',
  wallets:    'var(--accent-light)',
  trading:    'var(--danger)',
  web3:       'var(--primary)',
};

export function ChaptersPage() {
  const navigate = useNavigate();
  const t = useT();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Chapter | null>(null);
  const [filterTag, setFilterTag] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiService.getChapters()
      .then(setChapters)
      .catch(() => setError('No se pudo cargar el contenido.'))
      .finally(() => setLoading(false));
  }, []);

  const tags = Array.from(new Set(chapters.map(c => c.moduleTag).filter(Boolean))) as string[];
  const filtered = filterTag ? chapters.filter(c => c.moduleTag === filterTag) : chapters;

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div className="container">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}
        >
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em', marginBottom: 6 }}>
            {t('learningChapters')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {chapters.length} {t('chaptersAvailable')}
          </p>
        </motion.div>

        {/* Tag filters */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            <button
              className="btn btn-sm"
              style={{
                background: !filterTag ? 'var(--primary)' : 'var(--bg-overlay)',
                color: !filterTag ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border-active)',
              }}
              onClick={() => setFilterTag('')}
            >
              {t('all')}
            </button>
            {tags.map(tag => (
              <button
                key={tag}
                className="btn btn-sm"
                style={{
                  background: filterTag === tag ? `${TAG_COLORS[tag] || 'var(--primary)'}18` : 'var(--bg-overlay)',
                  color: filterTag === tag ? (TAG_COLORS[tag] || 'var(--primary)') : 'var(--text-muted)',
                  border: `1px solid ${filterTag === tag ? (TAG_COLORS[tag] || 'var(--primary)') + '40' : 'var(--border-active)'}`,
                }}
                onClick={() => setFilterTag(tag)}
              >
                <Tag size={12} /> {tag}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 8, padding: '12px 16px', color: 'var(--danger)', marginBottom: 20, fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>{t('loadingChapters')}</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <BookOpen size={40} style={{ color: 'var(--text-subtle)', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)' }}>{t('noChapters')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {filtered.map((ch, i) => {
              const accent = TAG_COLORS[ch.moduleTag || ''] || 'var(--primary)';
              return (
                <motion.div
                  key={ch.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card"
                  style={{
                    cursor: ch.accessible === false ? 'not-allowed' : 'pointer',
                    position: 'relative', overflow: 'hidden',
                    opacity: ch.accessible === false ? 0.5 : 1,
                  }}
                  whileHover={ch.accessible !== false ? { y: -3, borderColor: 'var(--border-active)' } : {}}
                  onClick={() => ch.accessible !== false ? navigate(`/chapters/${ch.moduleTag || ch.id}`) : null}
                >
                  {/* White shimmer top */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 56,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, transparent 100%)',
                    borderRadius: '10px 10px 0 0',
                    pointerEvents: 'none',
                  }} />

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 8,
                      background: `${accent}14`,
                      border: `1px solid ${accent}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: accent, flexShrink: 0,
                    }}>
                      <BookOpen size={18} />
                    </div>

                    {ch.moduleTag && (
                      <span className="badge" style={{
                        background: `${accent}12`,
                        color: accent,
                        border: `1px solid ${accent}25`,
                      }}>
                        {ch.moduleTag}
                      </span>
                    )}
                    {ch.requiredPlan && ch.requiredPlan !== 'free' && (
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(245,166,35,0.12)',
                          color: ch.requiredPlan === 'max' ? '#F5A623' : '#E91E8C',
                          border: `1px solid ${ch.requiredPlan === 'max' ? 'rgba(245,166,35,0.25)' : 'rgba(233,30,140,0.25)'}`,
                        }}
                      >
                        {ch.requiredPlan.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, lineHeight: 1.4, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {ch.accessible === false && '\uD83D\uDD12 '}{ch.title}
                  </h3>

                  {ch.accessible === false && ch.lockedReason && (
                    <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 6, padding: '6px 10px', marginBottom: 8, fontSize: '0.75rem', color: '#f59e0b' }}>
                      {ch.lockedReason === 'requires_max'
                        ? 'Disponible solo para Max.'
                        : ch.lockedReason === 'requires_pro'
                          ? 'Disponible para Pro o Max.'
                          : 'Disponible pronto.'}
                    </div>
                  )}

                  {ch.description && (
                    <p style={{
                      color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 16,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                    }}>
                      {ch.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {ch.estimatedMinutes && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', color: 'var(--text-subtle)' }}>
                          <Clock size={12} /> {ch.estimatedMinutes} min
                        </span>
                      )}
                      {ch.xpReward > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', color: 'var(--accent-light)' }}>
                          <Zap size={12} /> +{ch.xpReward} XP
                        </span>
                      )}
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text-subtle)' }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Reader Modal ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-active)',
                borderRadius: 12,
                width: '100%', maxWidth: 680,
                maxHeight: '88vh',
                overflow: 'auto',
                padding: 32,
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  {selected.moduleTag && (
                    <span className="badge badge-blue" style={{ marginBottom: 10, display: 'inline-flex' }}>
                      {selected.moduleTag}
                    </span>
                  )}
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                    {selected.title}
                  </h2>
                  <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                    {selected.estimatedMinutes && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <Clock size={13} /> {selected.estimatedMinutes} min
                      </span>
                    )}
                    {selected.xpReward > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--accent-light)' }}>
                        <Zap size={13} /> +{selected.xpReward} XP
                      </span>
                    )}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} style={{ flexShrink: 0 }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

              {/* Content */}
              {selected.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>
                  {selected.description}
                </p>
              )}

              {selected.content ? (
                <div style={{
                  color: 'var(--text)',
                  fontSize: '0.95rem',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {selected.content}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-subtle)', padding: '32px 0' }}>
                  Este capítulo no tiene contenido aún.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
