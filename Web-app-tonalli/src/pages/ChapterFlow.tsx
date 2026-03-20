import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

    if (mod.type === 'final_exam') {
      setView({ step: 'final_exam', mod });
      return;
    }

    // Lesson module: figure out which section to show
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
      // All done, let them review
      const data = await apiService.getModuleContent(mod.id);
      setView({ step: 'info', mod, content: data.content });
    }
  };

  const goToSection = async (mod: ChapterModuleData, section: 'info' | 'video' | 'quiz') => {
    if (section === 'quiz') {
      setView({ step: 'quiz', mod });
    } else {
      const data = await apiService.getModuleContent(mod.id);
      if (section === 'info') {
        setView({ step: 'info', mod, content: data.content });
        setInfoRead(false);
      } else {
        setView({ step: 'video', mod, videoUrl: data.videoUrl });
      }
    }
  };

  const handleCompleteInfo = async (moduleId: string) => {
    await apiService.completeInfoModule(moduleId);
    await loadChapter();
    // Auto-advance to video or quiz
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
    if (mod && !mod.sections?.quiz?.completed) {
      setView({ step: 'quiz', mod });
    } else {
      setView({ step: 'overview' });
    }
  };

  const handleQuizComplete = async () => {
    await loadChapter();
    const updated = await apiService.getChapterWithProgress(chapterId!);
    setChapter(updated);

    // Check 75% conversion
    if (updated.completionPercent === 75 && !user?.isPremium) {
      setShowConversion(true);
    } else {
      setView({ step: 'overview' });
    }
  };

  const handleUnlockExam = async () => {
    await apiService.unlockFinalExam(chapterId!);
    setShowConversion(false);
    await loadChapter();
    setView({ step: 'overview' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  if (!chapter) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400">Capitulo no encontrado</div>;
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

  // ── Active view rendering ────────────────────────────────────────────────

  if (view.step !== 'overview') {
    const mod = 'mod' in view ? view.mod : null;
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setView({ step: 'overview' })} className="text-gray-400 hover:text-white text-xl">&larr;</button>
          <div className="flex-1">
            <h2 className="text-white font-bold">{mod?.title}</h2>
            <p className="text-gray-400 text-sm">
              {chapter.title} &middot; {view.step === 'info' ? 'Lectura' : view.step === 'video' ? 'Video' : view.step === 'quiz' ? 'Quiz' : 'Examen Final'}
            </p>
          </div>
          {(view.step === 'quiz' || view.step === 'final_exam') && mod && (
            <LivesIndicator lives={mod.livesRemaining} lockedUntil={mod.lockedUntil} />
          )}
        </div>

        <div className="max-w-3xl mx-auto p-4">
          {/* Section tabs for lesson modules */}
          {mod?.type === 'lesson' && mod.sections && (
            <div className="flex gap-2 mb-6">
              {[
                { key: 'info' as const, label: 'Lectura', icon: '\uD83D\uDCDA', done: mod.sections.info.completed },
                { key: 'video' as const, label: 'Video', icon: '\uD83C\uDFAC', done: mod.sections.video.completed },
                { key: 'quiz' as const, label: 'Quiz', icon: '\uD83D\uDCDD', done: mod.sections.quiz.completed },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => goToSection(mod, tab.key)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition ${
                    view.step === tab.key
                      ? 'bg-yellow-500 text-gray-900'
                      : tab.done
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}
                >
                  {tab.icon} {tab.label} {tab.done ? '\u2714' : ''}
                </button>
              ))}
            </div>
          )}

          {/* Info */}
          {view.step === 'info' && 'content' in view && (
            <div>
              <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatContent(view.content || '') }} />
              {!mod?.sections?.info.completed && (
                <div className="mt-8 text-center">
                  {!infoRead ? (
                    <button onClick={() => setInfoRead(true)} className="bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-xl hover:bg-yellow-400">
                      He terminado de leer
                    </button>
                  ) : (
                    <button onClick={() => handleCompleteInfo(mod!.id)} className="bg-green-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-400">
                      Completar y continuar
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Video */}
          {view.step === 'video' && 'videoUrl' in view && mod && (
            <VideoModule
              moduleId={mod.id}
              videoUrl={view.videoUrl}
              completed={!!mod.sections?.video.completed}
              progress={mod.sections?.video.progress || 0}
              onComplete={() => handleVideoComplete(mod.id)}
            />
          )}

          {/* Quiz (module quiz) */}
          {view.step === 'quiz' && mod && (
            <ChapterQuiz
              moduleId={mod.id}
              type="quiz"
              lives={mod.livesRemaining}
              lockedUntil={mod.lockedUntil}
              completed={!!mod.sections?.quiz.completed}
              bestScore={mod.sections?.quiz.score || 0}
              isPremium={chapter.isPremium}
              chapterId={chapter.id}
              chapterTitle={chapter.title}
              onComplete={handleQuizComplete}
            />
          )}

          {/* Final exam */}
          {view.step === 'final_exam' && mod && (
            <ChapterQuiz
              moduleId={mod.id}
              type="final_exam"
              lives={mod.livesRemaining}
              lockedUntil={mod.lockedUntil}
              completed={mod.completed}
              bestScore={mod.score}
              isPremium={chapter.isPremium}
              chapterId={chapter.id}
              chapterTitle={chapter.title}
              onComplete={handleQuizComplete}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Chapter overview ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <div className="px-4 py-6">
        <button onClick={() => navigate('/chapters')} className="text-gray-400 hover:text-white mb-3 block">&larr; Capitulos</button>
        <h1 className="text-2xl font-bold text-white mb-2">{chapter.title}</h1>
        <p className="text-gray-400">{chapter.description}</p>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Progreso</span>
            <span className="text-yellow-400 font-bold">{chapter.completionPercent}%</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-500" style={{ width: `${chapter.completionPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {chapter.modules.map((mod) => {
          const isExam = mod.type === 'final_exam';
          const s = mod.sections;
          const sectionsDone = s ? [s.info.completed, s.video.completed || !s.video.hasVideo, s.quiz.completed].filter(Boolean).length : 0;
          const sectionsTotal = s ? (s.video.hasVideo ? 3 : 2) : 0;

          return (
            <button
              key={mod.id}
              onClick={() => openModule(mod)}
              disabled={!mod.unlocked}
              className={`w-full text-left rounded-xl p-4 transition-all ${
                mod.unlocked
                  ? 'bg-gray-800 hover:bg-gray-750 cursor-pointer border border-gray-700 hover:border-gray-600'
                  : 'bg-gray-800/50 opacity-50 cursor-not-allowed border border-gray-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${
                  mod.completed ? 'from-green-500 to-green-400' : isExam ? 'from-yellow-600 to-yellow-500' : 'from-blue-600 to-blue-500'
                }`}>
                  {mod.completed ? '\u2714' : isExam ? '\uD83C\uDFC6' : mod.order}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-bold">
                      {isExam ? 'EXAMEN FINAL' : `MODULO ${mod.order}`}
                    </span>
                    {mod.completed && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Completado</span>}
                    {!mod.unlocked && <span className="text-xs bg-gray-600/50 text-gray-400 px-2 py-0.5 rounded-full">Bloqueado</span>}
                  </div>
                  <h3 className="text-white font-semibold mt-0.5">{mod.title}</h3>

                  {/* Section progress for lesson modules */}
                  {s && !mod.completed && mod.unlocked && (
                    <div className="flex items-center gap-3 mt-2">
                      <SectionDot done={s.info.completed} label="Lectura" icon={'\uD83D\uDCDA'} />
                      {s.video.hasVideo && <SectionDot done={s.video.completed} label="Video" icon={'\uD83C\uDFAC'} />}
                      <SectionDot done={s.quiz.completed} label="Quiz" icon={'\uD83D\uDCDD'} />
                      <span className="text-xs text-gray-600 ml-auto">{sectionsDone}/{sectionsTotal}</span>
                    </div>
                  )}

                  {isExam && (
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>10 preguntas de los 3 modulos</span>
                      <span>Min. 80%</span>
                    </div>
                  )}
                </div>

                {mod.score > 0 && (
                  <span className={`text-lg font-bold ${mod.score >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {mod.score}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionDot({ done, label, icon }: { done: boolean; label: string; icon: string }) {
  return (
    <div className={`flex items-center gap-1 text-xs ${done ? 'text-green-400' : 'text-gray-600'}`}>
      <span>{icon}</span>
      <span>{done ? '\u2714' : label}</span>
    </div>
  );
}

function formatContent(content: string): string {
  if (!content) return '<p>No hay contenido disponible aun.</p>';

  // Try JSON format (legacy support)
  try {
    const parsed = JSON.parse(content);
    if (parsed.sections) {
      let html = parsed.sections.map((s: any) =>
        `<h3>${s.icon || ''} ${s.title}</h3><p>${(s.text || '').replace(/\n/g, '<br/>')}</p>`
      ).join('');
      if (parsed.keyTerms?.length) {
        html += '<h3>Terminos clave</h3><ul>';
        html += parsed.keyTerms.map((t: any) => `<li><strong>${t.term}</strong>: ${t.definition}</li>`).join('');
        html += '</ul>';
      }
      return html;
    }
  } catch { /* not JSON, treat as plain text */ }

  // Plain text: convert line breaks and basic markdown-like formatting
  return content
    .split('\n\n')
    .map((paragraph) => {
      // Headers (lines ending with :)
      if (paragraph.match(/^[A-ZÁÉÍÓÚÑ¿¡].{3,80}:?\s*$/m) && paragraph.split('\n').length === 1) {
        return `<h3>${paragraph}</h3>`;
      }
      // Bullet lists
      if (paragraph.includes('\n•') || paragraph.startsWith('•')) {
        const lines = paragraph.split('\n');
        const title = lines[0].startsWith('•') ? '' : `<p><strong>${lines[0]}</strong></p>`;
        const items = lines.filter(l => l.startsWith('•')).map(l => `<li>${l.slice(1).trim()}</li>`).join('');
        return `${title}<ul>${items}</ul>`;
      }
      // Numbered lists
      if (paragraph.match(/^\d+\./m)) {
        const lines = paragraph.split('\n');
        const items = lines.filter(l => l.match(/^\d+\./)).map(l => `<li>${l.replace(/^\d+\.\s*/, '')}</li>`).join('');
        return `<ol>${items}</ol>`;
      }
      // Regular paragraph
      return `<p>${paragraph.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');
}
