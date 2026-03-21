import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ChevronRight, BookOpen, Play, FileQuestion, Trophy } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
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
    if (updated.completionPercent === 75 && !user?.isPremium) { setShowConversion(true); }
    else { setView({ step: 'overview' }); }
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
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando capitulo...</div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--danger)' }}>Capitulo no encontrado</div>
      </div>
    );
  }

  // ── Locked by week ───────────────────────────────────────────────────────
  if (chapter.accessible === false) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <Lock size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>Capitulo bloqueado</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{chapter.lockedReason}</p>
          {!chapter.isPremium && (
            <div className="card" style={{ padding: 16, marginBottom: 16, border: '1px solid rgba(201,146,10,0.3)', background: 'rgba(201,146,10,0.06)' }}>
              <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem' }}>Los usuarios Premium acceden a 2 capitulos por semana</p>
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
          <button onClick={() => setView({ step: 'overview' })} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>&larr;</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{mod?.title}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {chapter.title} &middot; {view.step === 'info' ? 'Lectura' : view.step === 'video' ? 'Video' : view.step === 'quiz' ? 'Quiz' : 'Examen Final'}
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
                { key: 'info' as const, label: 'Lectura', icon: <BookOpen size={14} />, done: mod.sections.info.completed },
                { key: 'video' as const, label: 'Video', icon: <Play size={14} />, done: mod.sections.video.completed },
                { key: 'quiz' as const, label: 'Quiz', icon: <FileQuestion size={14} />, done: mod.sections.quiz.completed },
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
                    <button className="btn btn-primary btn-lg" onClick={() => setInfoRead(true)}>He terminado de leer</button>
                  ) : (
                    <button className="btn btn-primary btn-lg" style={{ background: 'var(--success)' }} onClick={() => handleCompleteInfo(mod!.id)}>Completar y continuar &rarr;</button>
                  )}
                </div>
              )}
              {mod?.sections?.info.completed && (
                <div style={{ textAlign: 'center', marginTop: 24, color: 'var(--success)', fontWeight: 700 }}>\u2714 Lectura completada</div>
              )}
            </div>
          )}

          {/* Video */}
          {view.step === 'video' && 'videoUrl' in view && mod && (
            <VideoModule moduleId={mod.id} videoUrl={view.videoUrl} completed={!!mod.sections?.video.completed} progress={mod.sections?.video.progress || 0} onComplete={() => handleVideoComplete(mod.id)} />
          )}

          {/* Quiz */}
          {view.step === 'quiz' && mod && (
            <ChapterQuiz moduleId={mod.id} type="quiz" lives={mod.livesRemaining} lockedUntil={mod.lockedUntil} completed={!!mod.sections?.quiz.completed} bestScore={mod.sections?.quiz.score || 0} isPremium={chapter.isPremium} chapterId={chapter.id} chapterTitle={chapter.title} onComplete={handleQuizComplete} />
          )}

          {/* Final exam */}
          {view.step === 'final_exam' && mod && (
            <ChapterQuiz moduleId={mod.id} type="final_exam" lives={mod.livesRemaining} lockedUntil={mod.lockedUntil} completed={mod.completed} bestScore={mod.score} isPremium={chapter.isPremium} chapterId={chapter.id} chapterTitle={chapter.title} onComplete={handleQuizComplete} />
          )}
        </div>
      </div>
    );
  }

  // ── Chapter overview ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(26,127,75,0.12), rgba(201,146,10,0.08))',
        borderBottom: '1px solid var(--border)',
        padding: '32px 24px 24px',
      }}>
        <div className="container">
          <button onClick={() => navigate('/chapters')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 16, fontSize: '0.9rem' }}>&larr; Capitulos</button>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" }}>{chapter.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>{chapter.description}</p>

          {/* Progress bar */}
          <div style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Progreso</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{chapter.completionPercent}%</span>
            </div>
            <div className="progress-bar" style={{ height: 10 }}>
              <div className="progress-fill" style={{ width: `${chapter.completionPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Modules */}
      <div className="container" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chapter.modules.map((mod, i) => {
            const isExam = mod.type === 'final_exam';
            const s = mod.sections;
            const sectionsDone = s ? [s.info.completed, s.video.completed || !s.video.hasVideo, s.quiz.completed].filter(Boolean).length : 0;
            const sectionsTotal = s ? (s.video.hasVideo ? 3 : 2) : 0;

            const colors = isExam
              ? { bg: 'rgba(201,146,10,0.12)', border: 'rgba(201,146,10,0.3)', icon: 'linear-gradient(135deg, #c9920a, #f0b429)' }
              : mod.completed
                ? { bg: 'rgba(63,185,80,0.08)', border: 'rgba(63,185,80,0.3)', icon: 'linear-gradient(135deg, #1a7f4b, #3fb950)' }
                : { bg: 'var(--bg-elevated)', border: 'var(--border)', icon: 'linear-gradient(135deg, #58a6ff, #8b5cf6)' };

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <button
                  onClick={() => openModule(mod)}
                  disabled={!mod.unlocked}
                  style={{
                    width: '100%', textAlign: 'left', borderRadius: 14, padding: '18px 20px',
                    background: colors.bg,
                    border: `1px solid ${mod.unlocked ? colors.border : 'var(--border)'}`,
                    cursor: mod.unlocked ? 'pointer' : 'not-allowed',
                    opacity: mod.unlocked ? 1 : 0.4,
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 16,
                    color: 'var(--text)',
                  }}
                >
                  {/* Module circle */}
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    background: mod.unlocked ? colors.icon : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 900, fontSize: '1.1rem',
                    boxShadow: mod.unlocked && !mod.completed ? '0 0 0 4px rgba(26,127,75,0.15)' : 'none',
                  }}>
                    {!mod.unlocked ? <Lock size={20} /> : mod.completed ? '\u2714' : isExam ? <Trophy size={22} /> : mod.order}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isExam ? 'Examen Final' : `Modulo ${mod.order}`}
                      </span>
                      {mod.completed && (
                        <span style={{ fontSize: '0.68rem', background: 'rgba(63,185,80,0.15)', color: 'var(--success)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>Completado</span>
                      )}
                      {!mod.unlocked && (
                        <span style={{ fontSize: '0.68rem', background: 'var(--bg-subtle)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Bloqueado</span>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{mod.title}</div>

                    {/* Section dots for lesson modules */}
                    {s && !mod.completed && mod.unlocked && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                        <SectionBadge done={s.info.completed} label="Lectura" icon={<BookOpen size={12} />} />
                        {s.video.hasVideo && <SectionBadge done={s.video.completed} label="Video" icon={<Play size={12} />} />}
                        <SectionBadge done={s.quiz.completed} label="Quiz" icon={<FileQuestion size={12} />} />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginLeft: 'auto' }}>{sectionsDone}/{sectionsTotal}</span>
                      </div>
                    )}

                    {isExam && !mod.completed && (
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>10 preguntas de los 3 modulos</span>
                        <span>Min. 80%</span>
                      </div>
                    )}
                  </div>

                  {/* Score or arrow */}
                  {mod.score > 0 ? (
                    <div style={{ fontWeight: 900, fontSize: '1.2rem', color: mod.score >= 80 ? 'var(--success)' : 'var(--accent)', flexShrink: 0 }}>
                      {mod.score}%
                    </div>
                  ) : mod.unlocked ? (
                    <ChevronRight size={20} color="var(--text-subtle)" style={{ flexShrink: 0 }} />
                  ) : null}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionBadge({ done, label, icon }: { done: boolean; label: string; icon: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem',
      color: done ? 'var(--success)' : 'var(--text-subtle)',
      fontWeight: done ? 700 : 400,
    }}>
      {icon}
      <span>{done ? '\u2714' : label}</span>
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
