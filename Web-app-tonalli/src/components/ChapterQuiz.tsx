import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { LivesIndicator } from './LivesIndicator';
import { useIssueCertificate } from '../hooks/useIssueCertificate';
import type { QuizQuestion } from '../types';

interface Props {
  moduleId: string;
  type: 'quiz' | 'final_exam';
  lives: number;
  lockedUntil: string | null;
  completed: boolean;
  bestScore: number;
  isPremium: boolean;
  chapterId: string;
  chapterTitle: string;
  onComplete: () => void;
}

export function ChapterQuiz({
  moduleId, type, lives, lockedUntil, completed, bestScore,
  isPremium, chapterId, chapterTitle, onComplete,
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

  // Ref to track if quiz is active (avoid stale closure issues)
  const quizActiveRef = useRef(false);
  const abandoningRef = useRef(false);

  const isLocked = lives === 0 && !!lockedUntil;

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

    // 6. Keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!quizActiveRef.current) return;
      const blocked =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
        (e.ctrlKey && ['u', 'U'].includes(e.key));

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
        onComplete();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar respuestas');
    }
    setLoading(false);
  };

  // ── Abandon penalty screen ───────────────────────────────────────────────
  if (abandonResult?.penalized) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">{'\u26A0\uFE0F'}</div>
        <h3 className="text-red-400 text-xl font-bold mb-4">Quiz cancelado</h3>
        <p className="text-gray-300 mb-2">{abandonResult.message}</p>
        <p className="text-gray-500 text-sm mb-6">
          Salir de la ventana del quiz durante un intento cuenta como una vida perdida.
          Las preguntas se regeneran en cada intento.
        </p>
        {abandonResult.livesRemaining !== undefined && (
          <div className="mb-6">
            <LivesIndicator
              lives={abandonResult.livesRemaining}
              lockedUntil={abandonResult.lockedUntil}
            />
          </div>
        )}
        {(abandonResult.livesRemaining > 0 || abandonResult.livesRemaining === -1) && (
          <button
            onClick={() => { setAbandonResult(null); startQuiz(); }}
            className="bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-xl hover:bg-yellow-400"
          >
            Intentar de nuevo (preguntas nuevas)
          </button>
        )}
        <button
          onClick={() => { setAbandonResult(null); onComplete(); }}
          className="block mx-auto mt-4 text-gray-400 hover:text-white"
        >
          Volver al capitulo
        </button>
      </div>
    );
  }

  // ── Locked screen ────────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">{'\uD83D\uDD12'}</div>
        <h3 className="text-white text-xl font-bold mb-4">Quiz bloqueado</h3>
        <LivesIndicator lives={0} lockedUntil={lockedUntil} />
        <p className="text-gray-400 mt-4">
          Se agotaron tus vidas. Espera para intentar de nuevo.
        </p>
        {!isPremium && (
          <p className="text-yellow-400 text-sm mt-2">
            Los usuarios Premium tienen vidas ilimitadas
          </p>
        )}
      </div>
    );
  }

  // ── Already completed ────────────────────────────────────────────────────
  if (completed && !started) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">{'\u2705'}</div>
        <h3 className="text-white text-xl font-bold mb-2">
          {type === 'final_exam' ? 'Examen final aprobado' : 'Quiz aprobado'}
        </h3>
        <p className="text-green-400 text-2xl font-bold">{bestScore}%</p>
        <button
          onClick={startQuiz}
          className="mt-6 bg-gray-700 text-white py-2 px-6 rounded-xl hover:bg-gray-600"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  // ── Pre-start screen ─────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">
          {type === 'final_exam' ? '\uD83C\uDFC6' : '\uD83D\uDCDD'}
        </div>
        <h3 className="text-white text-xl font-bold mb-2">
          {type === 'final_exam' ? 'Examen Final' : 'Quiz de Evaluacion'}
        </h3>
        <p className="text-gray-400 mb-2">Necesitas 80% para aprobar</p>
        <div className="mb-4">
          <LivesIndicator lives={lives} lockedUntil={null} />
        </div>

        {/* Anti-cheat rules */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
          <h4 className="text-yellow-400 font-bold text-sm mb-2">{'\u26A0\uFE0F'} Reglas del quiz:</h4>
          <ul className="text-gray-400 text-xs space-y-1">
            <li>{'\u2022'} No cambies de pestaña ni minimices la ventana</li>
            <li>{'\u2022'} No uses copiar/pegar ni click derecho</li>
            <li>{'\u2022'} No abras las herramientas de desarrollador</li>
            <li>{'\u2022'} Salir del quiz = pierdes una vida</li>
            <li>{'\u2022'} Las preguntas cambian en cada intento</li>
          </ul>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}
        <button
          onClick={startQuiz}
          disabled={loading}
          className="bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-xl hover:bg-yellow-400 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Comenzar'}
        </button>
      </div>
    );
  }

  // ── Results screen ───────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">
          {result.passed ? '\uD83C\uDF89' : '\uD83D\uDE14'}
        </div>
        <h3 className="text-white text-2xl font-bold mb-2">
          {result.passed ? 'Aprobaste!' : 'No aprobaste'}
        </h3>
        <p className={`text-3xl font-bold mb-4 ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
          {result.score}%
        </p>
        <p className="text-gray-400 mb-2">
          {result.correctCount} de {result.totalQuestions} correctas
        </p>
        {result.xpEarned > 0 && (
          <p className="text-yellow-400 font-bold">+{result.xpEarned} XP</p>
        )}
        <p className="text-gray-300 mt-4">{result.message}</p>

        {/* ACTA Certificate */}
        {certResult?.success && (
          <div className="mt-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-5">
            <div className="text-3xl mb-2">{'\uD83C\uDFC6'}</div>
            <h4 className="text-yellow-400 font-bold text-lg">Certificado ACTA Emitido</h4>
            <p className="text-gray-400 text-sm mt-1">Certificado oficial validado en Stellar Blockchain</p>
            <div className="mt-3 bg-gray-900/50 rounded-lg p-3 text-left">
              <p className="text-xs text-gray-500">VC ID:</p>
              <p className="text-xs text-gray-300 font-mono break-all">{certResult.vcId}</p>
              <p className="text-xs text-gray-500 mt-2">TX Hash:</p>
              <p className="text-xs text-gray-300 font-mono break-all">{certResult.txHash}</p>
            </div>
            <a href="/certificates" className="inline-block mt-3 text-sm text-yellow-400 hover:text-yellow-300 font-bold">
              Ver mis certificados &rarr;
            </a>
          </div>
        )}
        {issuingCert && (
          <div className="mt-4 text-yellow-400 text-sm animate-pulse">
            Emitiendo certificado ACTA en Stellar...
          </div>
        )}

        {result.livesRemaining !== undefined && result.livesRemaining >= 0 && !result.passed && (
          <div className="mt-4">
            <LivesIndicator lives={result.livesRemaining} lockedUntil={result.lockedUntil} />
          </div>
        )}

        <div className="mt-6 space-y-3">
          {!result.passed && result.livesRemaining !== 0 && (
            <button
              onClick={startQuiz}
              className="bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-xl hover:bg-yellow-400"
            >
              Intentar de nuevo (preguntas nuevas)
            </button>
          )}
          <button
            onClick={onComplete}
            className="block mx-auto text-gray-400 hover:text-white"
          >
            Volver al capitulo
          </button>
        </div>

        {/* Question review */}
        <div className="mt-8 text-left space-y-4">
          <h4 className="text-white font-bold">Revision de respuestas:</h4>
          {result.results?.map((r: any, i: number) => (
            <div key={i} className={`p-3 rounded-lg ${r.correct ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <p className="text-sm text-gray-300">{r.correct ? '\u2714' : '\u2718'} Pregunta {i + 1}</p>
              {r.explanation && <p className="text-xs text-gray-400 mt-1">{r.explanation}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Active quiz ──────────────────────────────────────────────────────────
  const q = questions[currentQ];
  if (!q) return null;

  return (
    <div className="select-none" onCopy={(e) => e.preventDefault()}>
      {/* Warning toast */}
      {showWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg animate-pulse font-bold text-sm">
          {'\u26A0\uFE0F'} Actividad sospechosa detectada. La proxima vez perderas una vida.
        </div>
      )}

      {/* Anti-cheat status bar */}
      <div className="flex items-center justify-between mb-4 bg-gray-800 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${violations === 0 ? 'bg-green-400' : violations === 1 ? 'bg-yellow-400' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-500">
            {violations === 0 ? 'Sin infracciones' : `${violations} infraccion${violations > 1 ? 'es' : ''}`}
          </span>
        </div>
        {!isPremium && (
          <LivesIndicator lives={Math.max(0, (lives === -1 ? 3 : lives) - violations)} lockedUntil={null} />
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-500 rounded-full transition-all"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-gray-400 text-sm">{currentQ + 1}/{questions.length}</span>
      </div>

      {/* Question */}
      <h3 className="text-white text-lg font-bold mb-6">{q.question}</h3>

      {/* Options */}
      <div className="space-y-3">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selected === i
                ? 'border-yellow-500 bg-yellow-500/10 text-white'
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
            }`}
          >
            <span className="font-bold mr-3 text-gray-500">
              {String.fromCharCode(65 + i)}.
            </span>
            {opt}
          </button>
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={selected === null || loading}
        className="mt-6 w-full bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl hover:bg-yellow-400 disabled:opacity-50 transition"
      >
        {loading ? 'Enviando...' : currentQ === questions.length - 1 ? 'Finalizar' : 'Siguiente'}
      </button>
    </div>
  );
}
