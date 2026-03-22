import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { LivesIndicator } from './LivesIndicator';
import { useIssueCertificate } from '../hooks/useIssueCertificate';
import { useT } from '../hooks/useT';
import type { QuizQuestion } from '../types';

interface Props {
  moduleId: string;
  type: 'quiz' | 'final_exam';
  lives: number;
  lockedUntil: string | null;
  completed: boolean;
  bestScore: number;
  plan: 'free' | 'pro' | 'max';
  chapterId: string;
  chapterTitle: string;
  onComplete: () => void;
}

export function ChapterQuiz({
  moduleId, type, lives, lockedUntil, completed, bestScore,
  plan, chapterId, chapterTitle, onComplete,
}: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [abandonResult, setAbandonResult] = useState<any>(null);
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [certResult, setCertResult] = useState<any>(null);
  const { issueCertificate, issuing: issuingCert } = useIssueCertificate();
  const t = useT();

  // Ref to track if quiz is active (avoid stale closure issues)
  const quizActiveRef = useRef(false);
  const abandoningRef = useRef(false);

  const isLocked = false; // No more 24h lock; module gets reset instead

  // ── Anti-cheat: report abandon and reset quiz ────────────────────────────
  const handleAbandon = useCallback(async (reason: string) => {
    if (!quizActiveRef.current || abandoningRef.current) return;
    abandoningRef.current = true;

    try {
      const res = await apiService.reportQuizAbandon(moduleId, reason);
      setAbandonResult(res);
      // Reset quiz state
      setStarted(false);
      setQuestions([]);
      setCurrentQ(0);
      setAnswers([]);
      setSelected(null);
      setViolations(0);
      quizActiveRef.current = false;
    } catch (err) {
      console.error('Failed to report abandon:', err);
    }
    abandoningRef.current = false;
  }, [moduleId]);

  // ── Anti-cheat listeners ─────────────────────────────────────────────────
  useEffect(() => {
    if (!started) return;

    // 1. Tab switch / window hidden (visibilitychange)
    const handleVisibilityChange = () => {
      if (document.hidden && quizActiveRef.current) {
        handleAbandon('tab_switch');
      }
    };

    // 2. Window blur (switching to another app/window)
    const handleBlur = () => {
      if (quizActiveRef.current) {
        // Small grace period (200ms) to avoid false positives from clicking browser UI
        setTimeout(() => {
          if (document.hidden && quizActiveRef.current) {
            handleAbandon('window_blur');
          }
        }, 200);
      }
    };

    // 3. Copy / Cut / Paste (trying to copy questions or paste answers)
    const handleCopy = (e: ClipboardEvent) => {
      if (quizActiveRef.current) {
        e.preventDefault();
        setViolations((v) => {
          const newV = v + 1;
          if (newV >= 2) {
            handleAbandon('clipboard_abuse');
          } else {
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 3000);
          }
          return newV;
        });
      }
    };

    // 4. Right click (trying to inspect/copy)
    const handleContextMenu = (e: MouseEvent) => {
      if (quizActiveRef.current) {
        e.preventDefault();
        setViolations((v) => {
          const newV = v + 1;
          if (newV >= 3) {
            handleAbandon('context_menu_abuse');
          } else {
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 3000);
          }
          return newV;
        });
      }
    };

    // 5. DevTools detection (resize-based heuristic)
    const threshold = 160;
    const handleResize = () => {
      if (quizActiveRef.current) {
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        if (widthDiff > threshold || heightDiff > threshold) {
          setViolations((v) => {
            const newV = v + 1;
            if (newV >= 2) {
              handleAbandon('devtools_detected');
            } else {
              setShowWarning(true);
              setTimeout(() => setShowWarning(false), 3000);
            }
            return newV;
          });
        }
      }
    };

    // 6. Keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, PrintScreen, Ctrl+P, Meta+Shift+3/4/5)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!quizActiveRef.current) return;

      // Screenshot keys
      const isScreenshot =
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && ['3', '4', '5', 's', 'S'].includes(e.key)) || // Mac
        (e.ctrlKey && e.shiftKey && ['s', 'S'].includes(e.key)); // Win Snip

      if (isScreenshot) {
        e.preventDefault();
        setViolations((v) => {
          const newV = v + 1;
          if (newV >= 2) {
            handleAbandon('screenshot_attempt');
          } else {
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 3500);
          }
          return newV;
        });
        return;
      }

      const blocked =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
        (e.ctrlKey && ['u', 'U', 'p', 'P'].includes(e.key)); // added Ctrl+P (print)

      if (blocked) {
        e.preventDefault();
        setViolations((v) => {
          const newV = v + 1;
          if (newV >= 2) {
            handleAbandon('devtools_shortcut');
          } else {
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 3000);
          }
          return newV;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);
    document.addEventListener('paste', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('paste', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [started, handleAbandon]);

  // ── Start quiz ───────────────────────────────────────────────────────────
  const startQuiz = async () => {
    setError('');
    setAbandonResult(null);
    setLoading(true);
    try {
      const data = await apiService.getChapterQuiz(moduleId);
      setQuestions(data.questions);

      // Demo: for final exam, auto-fill all correct answers and submit immediately
      if (type === 'final_exam') {
        const autoAnswers = data.questions.map((q: QuizQuestion) => ({
          questionId: q.id,
          selectedIndex: q.correctIndex,
        }));
        setAnswers(autoAnswers);
        setStarted(true);
        quizActiveRef.current = false;
        // Submit directly
        try {
          const res = await apiService.submitChapterQuiz(moduleId, autoAnswers);
          setResult(res);
          setStarted(false);
          if (res.passed && type === 'final_exam') {
            try {
              const cert = await issueCertificate({ chapterId, chapterTitle, examScore: res.score });
              setCertResult(cert);
            } catch (e) { console.warn('Certificate issuance failed:', e); }
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Error al enviar respuestas');
        }
        setLoading(false);
        return;
      }

      setCurrentQ(0);
      setAnswers([]);
      setSelected(null);
      setResult(null);
      setViolations(0);
      setStarted(true);
      quizActiveRef.current = true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al cargar el quiz';
      setError(msg);
    }
    setLoading(false);
  };

  const handleSelect = (index: number) => {
    setSelected(index);
  };

  const handleNext = () => {
    if (selected === null) return;
    const newAnswers = [...answers, { questionId: questions[currentQ].id, selectedIndex: selected }];
    setAnswers(newAnswers);
    setSelected(null);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers: typeof answers) => {
    setLoading(true);
    quizActiveRef.current = false; // stop anti-cheat during submit
    try {
      const res = await apiService.submitChapterQuiz(moduleId, finalAnswers);
      setResult(res);
      setStarted(false);
      if (res.passed) {
        // If final exam passed, issue ACTA certificate
        if (type === 'final_exam') {
          try {
            const cert = await issueCertificate({
              chapterId,
              chapterTitle,
              examScore: res.score,
            });
            setCertResult(cert);
          } catch (e) {
            console.warn('Certificate issuance failed:', e);
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar respuestas');
    }
    setLoading(false);
  };

  const isExam = type === 'final_exam';

  const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(135deg, #E91E8C, #F5A623)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '13px 24px',
    fontWeight: 800,
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(233,30,140,0.3)',
    letterSpacing: '0.01em',
  };

  const btnGhost: React.CSSProperties = {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '13px 24px',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
  };

  // ── Abandon penalty screen ───────────────────────────────────────────────
  // ── Results screen must be checked FIRST (before !started checks) ────────
  if (result) {
    const pointsPerQ = result.totalQuestions > 0 ? Math.round(100 / result.totalQuestions) : 0;
    const passed = result.passed;
    const scoreColor = passed ? '#00D4AA' : '#E91E8C';

    if (result.mustRedoModule) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🔄</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#E91E8C', marginBottom: 8 }}>
            Agotaste tus 2 intentos
          </h3>
          <p style={{ fontSize: '2.8rem', fontWeight: 900, color: '#E91E8C', marginBottom: 20 }}>
            {result.score}%
          </p>
          <div style={{
            background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.3)',
            borderRadius: 12, padding: '16px 20px', maxWidth: 400, margin: '0 auto 24px',
          }}>
            <p style={{ color: '#F5A623', fontWeight: 700, marginBottom: 8 }}>{t('moduleReset')}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              Como usuario gratuito tienes 2 intentos por módulo. Has agotado ambos y el módulo ha sido reiniciado automáticamente.
            </p>
          </div>
          {result.message && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>{result.message}</p>
          )}
          <button onClick={onComplete} style={btnPrimary}>{t('resetModule')}</button>
        </div>
      );
    }

    return (
      <div style={{ userSelect: 'none' }}>
        <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>{passed ? '🎉' : '😔'}</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 12 }}>
            {passed ? t('passed') : t('failed')}
          </h3>
          <div style={{ fontSize: '4rem', fontWeight: 900, color: scoreColor, lineHeight: 1, marginBottom: 8, textShadow: `0 0 32px ${scoreColor}60` }}>
            {result.score}%
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: 6 }}>
            {result.correctCount} de {result.totalQuestions} {t('correct')}
          </p>
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', marginBottom: 16 }}>
            {t('pointsWorth')} <strong style={{ color: scoreColor }}>{pointsPerQ} {t('pts')}</strong>
          </p>
          {result.xpEarned > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 12 }}>
              <span style={{ color: '#F5A623', fontWeight: 800 }}>+{result.xpEarned} XP</span>
            </div>
          )}
          {result.message && <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{result.message}</p>}
        </div>

        <div style={{
          background: passed ? 'rgba(0,212,170,0.08)' : 'rgba(233,30,140,0.08)',
          border: `1px solid ${passed ? 'rgba(0,212,170,0.3)' : 'rgba(233,30,140,0.3)'}`,
          borderRadius: 12, padding: '12px 18px', marginBottom: 20, textAlign: 'center',
        }}>
          <p style={{ color: scoreColor, fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>
            {passed
              ? t('passedBar')
              : `✗ ${t('needMinimum')} 80% ${t('toPass')} (${result.score}%)`}
          </p>
        </div>

        {certResult?.success && (
          <div style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(245,120,35,0.08))', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 14, padding: '20px', marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏆</div>
            <h4 style={{ color: '#F5A623', fontWeight: 800, fontSize: '1.05rem', marginBottom: 4 }}>Certificado Emitido</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 12 }}>Certificado validado en Stellar Blockchain</p>
            <a href="/certificates" style={{ color: '#F5A623', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>Ver mis certificados →</a>
          </div>
        )}
        {issuingCert && (
          <div style={{ textAlign: 'center', color: '#F5A623', fontSize: '0.85rem', marginBottom: 16 }}>
            ⏳ Emitiendo certificado en Stellar...
          </div>
        )}

        {result.livesRemaining !== undefined && result.livesRemaining >= 0 && !passed && (
          <div style={{ marginBottom: 20 }}>
            <LivesIndicator lives={result.livesRemaining} lockedUntil={result.lockedUntil} />
            {result.livesRemaining === 1 && plan === 'free' && (
              <p style={{ color: '#E91E8C', fontWeight: 700, fontSize: '0.85rem', textAlign: 'center', marginTop: 8 }}>
                {t('lastAttemptWarning')}
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {!passed && result.livesRemaining !== 0 && (
            <button onClick={startQuiz} style={btnPrimary}>{t('retryQuiz')}</button>
          )}
          <button onClick={onComplete} style={btnGhost}>{t('backToChapter')}</button>
        </div>

        <div>
          <h4 style={{ fontWeight: 800, marginBottom: 16, fontSize: '0.95rem', color: 'var(--text)' }}>{t('answerReview')}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.results?.map((r: any, i: number) => (
              <div key={i} style={{
                padding: '12px 16px', borderRadius: 10,
                background: r.correct ? 'rgba(0,212,170,0.07)' : 'rgba(233,30,140,0.07)',
                border: `1px solid ${r.correct ? 'rgba(0,212,170,0.25)' : 'rgba(233,30,140,0.25)'}`,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <span style={{ color: r.correct ? '#00D4AA' : '#E91E8C', fontWeight: 900, flexShrink: 0 }}>
                  {r.correct ? '✓' : '✗'}
                </span>
                <div>
                  <p style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>
                    {t('question')} {i + 1} — {r.correct ? `+${pointsPerQ} ${t('pts')}` : `0 ${t('pts')}`}
                  </p>
                  {r.explanation && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{r.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (abandonResult?.penalized) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>⚠️</div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#E91E8C', marginBottom: 8 }}>{t('quizCancelled')}</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{abandonResult.message}</p>
        <p style={{ color: 'var(--text-subtle)', fontSize: '0.82rem', marginBottom: 24 }}>
          {t('rule5')}
        </p>
        {abandonResult.livesRemaining !== undefined && (
          <div style={{ marginBottom: 24 }}>
            <LivesIndicator lives={abandonResult.livesRemaining} lockedUntil={abandonResult.lockedUntil} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          {(abandonResult.livesRemaining > 0 || abandonResult.livesRemaining === -1) && (
            <button onClick={() => { setAbandonResult(null); startQuiz(); }} style={btnPrimary}>
              {t('retryAgain')} →
            </button>
          )}
          <button onClick={() => { setAbandonResult(null); onComplete(); }} style={btnGhost}>
            {t('backToChapter')}
          </button>
        </div>
      </div>
    );
  }

  // ── Locked screen ────────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🔒</div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 12 }}>{t('quizCancelled')}</h3>
        <LivesIndicator lives={0} lockedUntil={lockedUntil} />
        <p style={{ color: 'var(--text-muted)', marginTop: 16, fontSize: '0.88rem' }}>
          Se agotaron tus intentos. El módulo ha sido reiniciado.
        </p>
      </div>
    );
  }

  // ── Already completed ────────────────────────────────────────────────────
  if (completed && !started) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(0,212,170,0.12)', border: '2px solid rgba(0,212,170,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem',
        }}>✓</div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 6 }}>
          {isExam ? t('examApproved') : t('quizApproved')}
        </h3>
        <p style={{ fontSize: '2.2rem', fontWeight: 900, color: '#00D4AA', marginBottom: 24 }}>{bestScore}%</p>
        <button onClick={startQuiz} style={btnGhost}>{t('retryAgain')}</button>
      </div>
    );
  }

  // ── Pre-start screen ─────────────────────────────────────────────────────
  if (!started) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Icon + title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
            background: isExam ? 'rgba(245,166,35,0.12)' : 'rgba(233,30,140,0.12)',
            border: `2px solid ${isExam ? 'rgba(245,166,35,0.3)' : 'rgba(233,30,140,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
          }}>
            {isExam ? '🏆' : '✏️'}
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 6 }}>
            {isExam ? t('finalExamTitle') : t('evaluationQuiz')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('needMinimum')} <strong style={{ color: '#F5A623' }}>80%</strong> {t('toPass')}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { icon: '❓', label: `${isExam ? '20' : '5'} ${t('questionsCount')}` },
            { icon: '🎯', label: t('minimum') },
            { icon: '🔀', label: t('random') },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Lives / attempts */}
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('availableAttempts')}</span>
          <LivesIndicator lives={lives} lockedUntil={null} />
        </div>

        {/* Last attempt warning */}
        {lives === 1 && plan === 'free' && (
          <div style={{
            background: 'rgba(233,30,140,0.08)', border: '1px solid rgba(233,30,140,0.3)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          }}>
            <p style={{ color: '#E91E8C', fontWeight: 700, fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>
              {t('lastAttemptWarning')}
            </p>
          </div>
        )}

        {/* Rules */}
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 24,
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            {t('quizRules')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              t('rule1'),
              t('rule2'),
              t('rule3'),
              t('rule4'),
              t('rule5'),
              t('rule6'),
              ...(plan === 'free' ? [t('rule7')] : []),
            ].map((rule, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: '#F5A623', flexShrink: 0, fontSize: '0.75rem', marginTop: 1 }}>•</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(233,30,140,0.08)', border: '1px solid rgba(233,30,140,0.3)', borderRadius: 10, padding: '10px 14px', color: '#E91E8C', fontSize: '0.85rem', marginBottom: 16, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button onClick={startQuiz} disabled={loading} style={{
          ...btnPrimary,
          width: '100%',
          padding: '15px 24px',
          fontSize: '1rem',
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? t('loadingQuestions') : isExam ? t('startExam') : t('startQuiz')}
        </button>
      </div>
    );
  }

  // ── Active quiz ──────────────────────────────────────────────────────────
  const q = questions[currentQ];
  if (!q) return null;

  const pct = Math.round(((currentQ + 1) / questions.length) * 100);
  const OPTION_COLORS = ['#E91E8C', '#F5A623', '#00D4AA', '#7C6FCD'];
  const OPTION_LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div style={{ userSelect: 'none' }} onCopy={(e) => e.preventDefault()}>
      {/* Warning toast */}
      {showWarning && (
        <div style={{
          position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(233,30,140,0.97)', color: '#fff', borderRadius: 12,
          padding: '12px 22px', fontWeight: 700, fontSize: '0.88rem',
          zIndex: 9999, boxShadow: '0 4px 24px rgba(233,30,140,0.4)',
          display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
        }}>
          {t('suspiciousActivity')}
        </div>
      )}

      {/* Header: status + lives */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '10px 16px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: violations === 0 ? '#00D4AA' : violations === 1 ? '#F5A623' : '#E91E8C',
          }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {violations === 0 ? t('noViolations') : `${violations} ${violations > 1 ? t('violations') : t('violation')}`}
          </span>
        </div>
        {plan === 'free' && (
          <LivesIndicator lives={Math.max(0, (lives === -1 ? 2 : lives) - violations)} lockedUntil={null} />
        )}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            {t('question')} {currentQ + 1} de {questions.length}
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: pct === 100 ? '#00D4AA' : '#F5A623' }}>
            {pct}%
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--bg-overlay)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 6,
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #E91E8C, #F5A623)',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Question card */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '24px 24px 20px', marginBottom: 20,
      }}>
        <div style={{
          fontSize: '0.68rem', fontWeight: 700, color: '#F5A623',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
        }}>
          {type === 'final_exam' ? '🏆 Examen Final' : '✏️ Quiz'}
        </div>
        <p style={{
          fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.5,
          color: 'var(--text)', margin: 0,
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          {q.question}
        </p>
      </div>

      {/* Options — 2×2 grid on wide screens, vertical on narrow */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        marginBottom: 24,
      }}>
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const color = OPTION_COLORS[i % OPTION_COLORS.length];
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              style={{
                textAlign: 'left', borderRadius: 14, padding: '16px 16px',
                background: isSelected ? `${color}15` : 'var(--bg-elevated)',
                border: `2px solid ${isSelected ? color : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all 0.18s ease',
                color: 'var(--text)', display: 'flex', alignItems: 'flex-start', gap: 12,
                boxShadow: isSelected ? `0 0 0 3px ${color}20` : 'none',
              }}
            >
              {/* Letter badge */}
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: isSelected ? color : 'var(--bg-overlay)',
                border: `1.5px solid ${isSelected ? color : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: '0.85rem',
                color: isSelected ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.18s ease',
              }}>
                {OPTION_LABELS[i]}
              </div>
              <span style={{
                fontSize: '0.88rem', lineHeight: 1.45, fontWeight: isSelected ? 600 : 400,
                color: isSelected ? 'var(--text)' : 'var(--text-muted)',
                paddingTop: 5,
              }}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Next / Finish button */}
      <button
        onClick={handleNext}
        disabled={selected === null || loading}
        style={{
          width: '100%', padding: '14px 24px', borderRadius: 12, border: 'none',
          background: selected !== null
            ? 'linear-gradient(135deg, #E91E8C, #F5A623)'
            : 'var(--bg-subtle)',
          color: selected !== null ? '#fff' : 'var(--text-muted)',
          fontWeight: 800, fontSize: '1rem', cursor: selected !== null ? 'pointer' : 'not-allowed',
          boxShadow: selected !== null ? '0 4px 16px rgba(233,30,140,0.3)' : 'none',
          transition: 'all 0.2s ease',
          letterSpacing: '0.01em',
        }}
      >
        {loading
          ? t('sending')
          : currentQ === questions.length - 1
            ? t('finish')
            : t('next')}
      </button>
    </div>
  );
}
