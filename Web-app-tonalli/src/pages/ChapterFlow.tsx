import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ChevronRight, BookOpen, Play, FileQuestion, Trophy } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';
import { useT } from '../hooks/useT';
import type { ChapterWithProgress, ChapterModuleData } from '../types';
import { VideoModule } from '../components/VideoModule';
import { LivesIndicator } from '../components/LivesIndicator';
import { ConversionScreen } from '../components/ConversionScreen';
import { ChapterQuiz } from '../components/ChapterQuiz';

type ActiveView =
  | { step: 'overview' }
  | { step: 'info'; mod: ChapterModuleData; content: any }
  | { step: 'video'; mod: ChapterModuleData; videoUrl: string }
  | { step: 'quiz'; mod: ChapterModuleData }
  | { step: 'final_exam'; mod: ChapterModuleData };

export function ChapterFlow() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const t = useT();
  const [chapter, setChapter] = useState<ChapterWithProgress | null>(null);
  const [view, setView] = useState<ActiveView>({ step: 'overview' });
  const [loading, setLoading] = useState(true);
  const [showConversion, setShowConversion] = useState(false);
  const [infoRead, setInfoRead] = useState(false);

  const loadChapter = async () => {
    if (!chapterId) return;
    try {
      const data = await apiService.getChapterWithProgress(chapterId);
      setChapter(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadChapter(); }, [chapterId]);

  const openModule = async (mod: ChapterModuleData) => {
    if (!mod.unlocked) return;
    if (mod.type === 'final_exam') { setView({ step: 'final_exam', mod }); return; }
    const s = mod.sections!;
    if (!s.info.completed && s.info.hasContent) {
      const data = await apiService.getModuleContent(mod.id);
      setView({ step: 'info', mod, content: data.content });
      setInfoRead(false);
    } else if (!s.video.completed && s.video.hasVideo) {
      const data = await apiService.getModuleContent(mod.id);
      setView({ step: 'video', mod, videoUrl: data.videoUrl });
    } else if (!s.quiz.completed) {
      setView({ step: 'quiz', mod });
    } else {
      const data = await apiService.getModuleContent(mod.id);
      setView({ step: 'info', mod, content: data.content });
    }
  };

  const goToSection = async (mod: ChapterModuleData, section: 'info' | 'video' | 'quiz') => {
    if (section === 'quiz') { setView({ step: 'quiz', mod }); }
    else {
      const data = await apiService.getModuleContent(mod.id);
      if (section === 'info') { setView({ step: 'info', mod, content: data.content }); setInfoRead(false); }
      else { setView({ step: 'video', mod, videoUrl: data.videoUrl }); }
    }
  };

  const handleCompleteInfo = async (moduleId: string) => {
    await apiService.completeInfoModule(moduleId);
    await loadChapter();
    const updated = await apiService.getChapterWithProgress(chapterId!);
    const mod = updated.modules.find((m: any) => m.id === moduleId);
    if (mod?.sections?.video?.hasVideo && !mod.sections.video.completed) {
      const data = await apiService.getModuleContent(moduleId);
      setView({ step: 'video', mod, videoUrl: data.videoUrl });
    } else {
      setView({ step: 'quiz', mod });
    }
  };

  const handleVideoComplete = async (moduleId: string) => {
    await loadChapter();
    const updated = await apiService.getChapterWithProgress(chapterId!);
    const mod = updated.modules.find((m: any) => m.id === moduleId);
    if (mod && !mod.sections?.quiz?.completed) { setView({ step: 'quiz', mod }); }
    else { setView({ step: 'overview' }); }
  };

  const handleQuizComplete = async () => {
    await loadChapter();
    const updated = await apiService.getChapterWithProgress(chapterId!);
    setChapter(updated);
    // Auto-unlock final exam at 75% (skip conversion screen for demo)
    if (updated.completionPercent >= 75) {
      try { await apiService.unlockFinalExam(chapterId!); } catch {}
      await loadChapter();
    }
    setView({ step: 'overview' });
  };

  const handleUnlockExam = async () => {
    await apiService.unlockFinalExam(chapterId!);
    setShowConversion(false);
    await loadChapter();
    setView({ step: 'overview' });
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('loadingChapter')}</div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--danger)' }}>{t('chapterNotFound')}</div>
      </div>
    );
  }

  // ── Locked by week ───────────────────────────────────────────────────────
  if (chapter.accessible === false) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <Lock size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>{t('chapterLocked')}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{chapter.lockedReason}</p>
          {chapter.requiredPlan && chapter.requiredPlan !== 'free' && (
            <div className="card" style={{ padding: 16, marginBottom: 16, border: '1px solid rgba(201,146,10,0.3)', background: 'rgba(201,146,10,0.06)' }}>
              <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem' }}>Mejora tu plan para desbloquear este capitulo premium</p>
            </div>
          )}
          <button className="btn btn-secondary" onClick={() => navigate('/chapters')}>&larr; Volver</button>
        </div>
      </div>
    );
  }

  if (showConversion) {
    return (
      <ConversionScreen
        chapterTitle={chapter.title}
        onUpgradePremium={() => navigate('/premium')}
        onBuyCertificate={handleUnlockExam}
        onSkip={() => { setShowConversion(false); setView({ step: 'overview' }); }}
      />
    );
  }

  // ── Active view (info / video / quiz / exam) ────────────────────────────
  if (view.step !== 'overview') {
    const mod = 'mod' in view ? view.mod : null;
    return (
      <div style={{ minHeight: '100vh' }}>
        {/* Header bar */}
        <div style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={async () => { await loadChapter(); setView({ step: 'overview' }); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>&larr;</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{mod?.title}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {chapter.title} &middot; {view.step === 'info' ? t('reading') : view.step === 'video' ? t('video') : view.step === 'quiz' ? t('quiz') : t('finalExam')}
            </div>
          </div>
          {(view.step === 'quiz' || view.step === 'final_exam') && mod && (
            <LivesIndicator lives={mod.livesRemaining} lockedUntil={mod.lockedUntil} />
          )}
        </div>

        <div className="container" style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
          {/* Section tabs for lesson modules */}
          {mod?.type === 'lesson' && mod.sections && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {[
                { key: 'info' as const, label: t('reading'), icon: <BookOpen size={14} />, done: mod.sections.info.completed },
                { key: 'video' as const, label: t('video'), icon: <Play size={14} />, done: mod.sections.video.completed },
                { key: 'quiz' as const, label: t('quiz'), icon: <FileQuestion size={14} />, done: mod.sections.quiz.completed },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => goToSection(mod, tab.key)}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: view.step === tab.key ? 'var(--primary)' : tab.done ? 'rgba(63,185,80,0.12)' : 'var(--bg-overlay)',
                    color: view.step === tab.key ? '#fff' : tab.done ? 'var(--success)' : 'var(--text-muted)',
                    border: view.step === tab.key ? '2px solid var(--primary)' : tab.done ? '1px solid rgba(63,185,80,0.3)' : '1px solid var(--border)',
                  }}
                >
                  {tab.icon} {tab.label} {tab.done ? ' \u2714' : ''}
                </button>
              ))}
            </div>
          )}

          {/* Info */}
          {view.step === 'info' && 'content' in view && (
            <div>
              <div style={{ lineHeight: 1.8, color: 'var(--text)', fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: formatContent(view.content || '') }} />
              {!mod?.sections?.info.completed && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  {!infoRead ? (
                    <button className="btn btn-primary btn-lg" onClick={() => setInfoRead(true)}>{t('doneReading')}</button>
                  ) : (
                    <button className="btn btn-primary btn-lg" style={{ background: 'var(--success)' }} onClick={() => handleCompleteInfo(mod!.id)}>{t('completeAndContinue')}</button>
                  )}
                </div>
              )}
              {mod?.sections?.info.completed && (
                <div style={{ textAlign: 'center', marginTop: 24, color: 'var(--success)', fontWeight: 700 }}>{t('readingCompleted')}</div>
              )}
              {language === 'en' && (
                <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 10, padding: '8px 14px', marginTop: 16, fontSize: '0.8rem', color: '#F5A623' }}>
                  {t('contentLanguageNotice')}
                </div>
              )}
            </div>
          )}

          {/* Video */}
          {view.step === 'video' && 'videoUrl' in view && mod && (
            <VideoModule moduleId={mod.id} videoUrl={view.videoUrl} completed={!!mod.sections?.video.completed} progress={mod.sections?.video.progress || 0} onComplete={() => handleVideoComplete(mod.id)} />
          )}

          {/* Quiz */}
          {view.step === 'quiz' && mod && (
            <ChapterQuiz moduleId={mod.id} type="quiz" lives={mod.livesRemaining} lockedUntil={mod.lockedUntil} completed={!!mod.sections?.quiz.completed} bestScore={mod.sections?.quiz.score || 0} plan={chapter.plan} chapterId={chapter.id} chapterTitle={chapter.title} onComplete={handleQuizComplete} />
          )}

          {/* Final exam */}
          {view.step === 'final_exam' && mod && (
            <ChapterQuiz moduleId={mod.id} type="final_exam" lives={mod.livesRemaining} lockedUntil={mod.lockedUntil} completed={mod.completed} bestScore={mod.score} plan={chapter.plan} chapterId={chapter.id} chapterTitle={chapter.title} onComplete={handleQuizComplete} />
          )}
        </div>
      </div>
    );
  }

  // ── Chapter overview ─────────────────────────────────────────────────────
  const pct = chapter.completionPercent;
  const completedMods = chapter.modules.filter((m: any) => m.completed).length;
  const totalMods = chapter.modules.length;
  const progressColor = pct === 100 ? '#00D4AA' : pct >= 50 ? '#F5A623' : '#E91E8C';

  const tagIcons: Record<string, string> = {
    blockchain: '🔗', stellar: '⭐', wallets: '👛', defi: '💱', nfts: '🎨',
  };
  const tagIcon = tagIcons[chapter.moduleTag ?? ''] ?? '📚';

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      {/* Header hero */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,30,140,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 24px 0', position: 'relative' }}>
          {/* Back */}
          <button onClick={() => navigate('/chapters')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', fontSize: '0.82rem', fontWeight: 600, padding: '4px 0', marginBottom: 20 }}>
            {t('backToChapters')}
          </button>

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}
          >
            {/* Top accent bar */}
            <div style={{ height: 4, background: 'linear-gradient(90deg, #E91E8C, #F5A623, #00D4AA)' }} />

            <div style={{ padding: '24px 28px 20px' }}>
              {/* Tag row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: '1.4rem' }}>{tagIcon}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {chapter.moduleTag ?? 'Capítulo'}
                </span>
                {pct === 100 && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(0,212,170,0.12)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.25)', padding: '3px 10px', borderRadius: 20 }}>
                    ✓ Completado
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, margin: '0 0 8px', fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                {chapter.title}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 20px', lineHeight: 1.65, maxWidth: 560 }}>
                {chapter.description}
              </p>

              {/* Stats + CTA */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                {/* Stats */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.8rem' }}>📦</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {chapter.plan !== 'free' ? `${totalMods} módulos` : `3 módulos (free)`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.8rem' }}>⚡</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{chapter.xpReward} XP</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.8rem' }}>🏅</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>NFT al completar</span>
                  </div>
                </div>

                {/* CTA button */}
                {(() => {
                  if (chapter.modules.length === 0) return null;
                  const firstUnlocked = chapter.modules.find((m: any) => m.unlocked && !m.completed);
                  const allDone = pct === 100;

                  if (allDone) {
                    return (
                      <button
                        onClick={() => openModule(chapter.modules[0])}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)', color: '#00D4AA', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        ✓ Repasar
                      </button>
                    );
                  }
                  const target = firstUnlocked ?? chapter.modules[0];
                  const isStarted = completedMods > 0;
                  return (
                    <button
                      onClick={() => openModule(target)}
                      disabled={!target.unlocked}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: target.unlocked ? 'linear-gradient(135deg, #E91E8C, #F5A623)' : 'var(--bg-subtle)', border: 'none', color: target.unlocked ? '#fff' : 'var(--text-muted)', borderRadius: 10, padding: '10px 20px', fontWeight: 800, fontSize: '0.88rem', cursor: target.unlocked ? 'pointer' : 'not-allowed', boxShadow: target.unlocked ? '0 4px 14px rgba(233,30,140,0.3)' : 'none', whiteSpace: 'nowrap' }}
                    >
                      {isStarted ? '▶ Continuar' : '🚀 Iniciar'}
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ background: 'var(--bg-overlay)', borderTop: '1px solid var(--border)', padding: '14px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {completedMods === 0 ? 'Sin iniciar' : `${completedMods} de ${totalMods} módulos`}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: progressColor }}>{pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 6, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                  style={{ height: '100%', borderRadius: 6, background: `linear-gradient(90deg, #E91E8C, ${progressColor})` }}
                />
              </div>
            </div>

            {/* Modules inside card */}
            <div style={{ padding: '20px 28px 24px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                Módulos del capítulo
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {chapter.modules.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Los módulos se están configurando, vuelve en un momento.
            </div>
          )}
          {chapter.modules.map((mod, i) => {
            const isExam = mod.type === 'final_exam';
            const s = mod.sections;
            const isLast = i === chapter.modules.length - 1;

            // State
            const isCompleted = mod.completed;
            const isActive = mod.unlocked && !isCompleted;
            const isLocked = !mod.unlocked;

            // Colors per state
            const nodeGradient = isCompleted
              ? 'linear-gradient(135deg, #00D4AA, #0DFFC6)'
              : isExam && isActive
                ? 'linear-gradient(135deg, #F5A623, #FFD60A)'
                : isActive
                  ? 'linear-gradient(135deg, #E91E8C, #F5A623)'
                  : 'var(--bg-subtle)';

            const cardBorder = isCompleted
              ? '1px solid rgba(0,212,170,0.25)'
              : isExam && isActive
                ? '1px solid rgba(245,166,35,0.35)'
                : isActive
                  ? '1px solid rgba(233,30,140,0.25)'
                  : '1px solid var(--border)';

            const cardBg = isCompleted
              ? 'rgba(0,212,170,0.04)'
              : isExam && isActive
                ? 'rgba(245,166,35,0.05)'
                : 'var(--bg-elevated)';

            // Section steps
            const steps = s ? [
              { label: 'Lectura', icon: '📖', done: s.info.completed, show: s.info.hasContent },
              { label: 'Video', icon: '🎬', done: s.video.completed, show: s.video.hasVideo },
              { label: 'Quiz', icon: '✏️', done: s.quiz.completed, show: true },
            ].filter(st => st.show) : [];

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                style={{ display: 'flex', gap: 0 }}
              >
                {/* Left: connector line + node */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 52, flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: isLocked ? 'var(--bg-subtle)' : nodeGradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isLocked ? 'var(--text-subtle)' : '#fff',
                    fontWeight: 900, fontSize: '1rem',
                    boxShadow: isActive ? '0 0 0 4px rgba(233,30,140,0.12)' : isCompleted ? '0 0 0 4px rgba(0,212,170,0.1)' : 'none',
                    transition: 'all 0.2s',
                    border: isLocked ? '1px solid var(--border)' : 'none',
                  }}>
                    {isLocked ? <Lock size={17} /> : isCompleted ? '✓' : isExam ? <Trophy size={19} /> : <span>{mod.order}</span>}
                  </div>
                  {!isLast && (
                    <div style={{
                      width: 2, flex: 1, minHeight: 20,
                      background: isCompleted ? 'linear-gradient(180deg, rgba(0,212,170,0.4), rgba(0,212,170,0.1))' : 'var(--border)',
                      margin: '4px 0',
                    }} />
                  )}
                </div>

                {/* Right: card */}
                <div style={{ flex: 1, paddingBottom: isLast ? 0 : 12, paddingLeft: 14 }}>
                  <button
                    onClick={() => openModule(mod)}
                    disabled={isLocked}
                    style={{
                      width: '100%', textAlign: 'left', borderRadius: 14,
                      padding: '16px 18px',
                      background: cardBg, border: cardBorder,
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      opacity: isLocked ? 0.5 : 1,
                      transition: 'all 0.18s',
                      color: 'var(--text)',
                    }}
                  >
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: isExam && isActive ? '#F5A623' : 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
                          {isExam ? '🏆 Examen Final' : `Módulo ${mod.order}`}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.97rem', lineHeight: 1.3, color: isLocked ? 'var(--text-muted)' : 'var(--text)' }}>
                          {mod.title}
                        </div>
                      </div>
                      {/* Right badge */}
                      <div style={{ flexShrink: 0 }}>
                        {isCompleted && mod.score > 0 ? (
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: '#00D4AA' }}>{mod.score}%</span>
                        ) : isCompleted ? (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'rgba(0,212,170,0.12)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)', padding: '3px 9px', borderRadius: 20 }}>✓ Listo</span>
                        ) : isLocked ? (
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-subtle)' }}>🔒</span>
                        ) : (
                          <ChevronRight size={18} color="var(--text-subtle)" />
                        )}
                      </div>
                    </div>

                    {/* Section steps — lesson modules */}
                    {steps.length > 0 && !isLocked && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                        {steps.map((st, si) => (
                          <div key={si} style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            fontSize: '0.75rem', fontWeight: st.done ? 700 : 500,
                            background: st.done ? 'rgba(0,212,170,0.1)' : 'var(--bg-overlay)',
                            border: `1px solid ${st.done ? 'rgba(0,212,170,0.25)' : 'var(--border)'}`,
                            color: st.done ? '#00D4AA' : 'var(--text-subtle)',
                            padding: '4px 10px', borderRadius: 20,
                          }}>
                            <span style={{ fontSize: '0.75rem' }}>{st.done ? '✓' : st.icon}</span>
                            {st.label}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Exam info */}
                    {isExam && !isCompleted && isActive && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        {['10 preguntas', 'Mín. 80%', 'Certificado NFT'].map((tag) => (
                          <span key={tag} style={{ fontSize: '0.72rem', fontWeight: 600, background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: '#F5A623', padding: '3px 9px', borderRadius: 20 }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Locked exam — free user */}
                    {isExam && isLocked && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', margin: '6px 0 0', lineHeight: 1.5 }}>
                        Completa los 3 módulos para desbloquear el examen final
                      </p>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function formatContent(content: string): string {
  if (!content) return '<p style="color:var(--text-muted)">No hay contenido disponible aun.</p>';

  // Try JSON (legacy)
  try {
    const parsed = JSON.parse(content);
    if (parsed.sections) {
      let html = parsed.sections.map((s: any) =>
        `<h3 style="font-size:1.15rem;font-weight:700;margin:24px 0 8px;color:var(--text);font-family:'Space Grotesk',sans-serif">${s.icon || ''} ${s.title}</h3><p style="color:var(--text-muted);margin-bottom:12px">${(s.text || '').replace(/\n/g, '<br/>')}</p>`
      ).join('');
      if (parsed.keyTerms?.length) {
        html += '<h3 style="font-size:1.05rem;font-weight:700;margin:24px 0 8px;color:var(--accent)">Terminos clave</h3><ul style="padding-left:20px">';
        html += parsed.keyTerms.map((t: any) => `<li style="margin-bottom:6px;color:var(--text-muted)"><strong style="color:var(--text)">${t.term}</strong>: ${t.definition}</li>`).join('');
        html += '</ul>';
      }
      return html;
    }
  } catch { /* plain text */ }

  // Plain text
  return content
    .split('\n\n')
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return '';

      // Short standalone line = heading
      if (trimmed.match(/^[A-ZÁÉÍÓÚÑ¿¡].{3,80}:?\s*$/) && !trimmed.includes('\n')) {
        return `<h3 style="font-size:1.15rem;font-weight:700;margin:28px 0 10px;color:var(--text);font-family:'Space Grotesk',sans-serif">${trimmed}</h3>`;
      }
      // Bullet list
      if (trimmed.includes('\n\u2022') || trimmed.startsWith('\u2022')) {
        const lines = trimmed.split('\n');
        const title = lines[0].startsWith('\u2022') ? '' : `<p style="color:var(--text);font-weight:600;margin-bottom:6px">${lines[0]}</p>`;
        const items = lines.filter(l => l.startsWith('\u2022')).map(l =>
          `<li style="margin-bottom:4px;color:var(--text-muted);padding-left:4px">${l.slice(1).trim()}</li>`
        ).join('');
        return `${title}<ul style="padding-left:20px;margin-bottom:12px">${items}</ul>`;
      }
      // Numbered list
      if (trimmed.match(/^\d+\./m)) {
        const lines = trimmed.split('\n');
        const items = lines.filter(l => l.match(/^\d+\./)).map(l =>
          `<li style="margin-bottom:6px;color:var(--text-muted)">${l.replace(/^\d+\.\s*/, '')}</li>`
        ).join('');
        return `<ol style="padding-left:20px;margin-bottom:12px">${items}</ol>`;
      }
      // Regular paragraph
      return `<p style="color:var(--text-muted);margin-bottom:14px;line-height:1.8">${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');
}
