import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Zap, Star } from 'lucide-react';
import { apiService } from '../services/api';
import { CharacterReaction } from '../components/CharacterReaction';
import { Confetti } from '../components/Confetti';
import { useProgressStore } from '../stores/progressStore';
import { useAuthStore } from '../stores/authStore';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
}

interface QuizResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  results: { questionId: string; correct: boolean; correctIndex: number; explanation: string }[];
  xpEarned: number;
  xlmReward: { amount: string; txHash?: string } | null;
  nftCertificate: { id: string; txHash: string; assetCode: string; status: string } | null;
  rewardsStatus?: 'none' | 'queued' | 'processing' | 'completed' | 'failed';
  rewardsRetryCount?: number;
  rewardsJobId?: string | null;
  rewardsError?: string | null;
  message: string;
}

type AnswerState = 'idle' | 'correct' | 'wrong';
type GameState = 'loading' | 'playing' | 'submitting' | 'finished';

export function Quiz() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { markLessonComplete } = useProgressStore();
  const { user, setUser } = useAuthStore();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [_lessonTitle, setLessonTitle] = useState('');
  const [_passingScore, setPassingScore] = useState(70);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [_localScore, setLocalScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>('loading');
  const [_showExplanation, setShowExplanation] = useState(false);
  const [characterMood, setCharacterMood] = useState<'idle' | 'happy' | 'excited' | 'thinking' | 'wrong' | 'celebrate'>('thinking');
  const [characterMessage, setCharacterMessage] = useState('Estas listo? Demuestra lo que sabes!');
  const [showConfetti, setShowConfetti] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    apiService.getQuiz(lessonId).then((data) => {
      setQuestions(data.questions || []);
      setLessonTitle(data.lessonTitle || '');
      setPassingScore(data.passingScore || 70);
      setGameState('playing');
      setCharacterMessage('Vamos! Demuestra lo que aprendiste.');
    }).catch(() => {
      setQuestions([]);
      setGameState('playing');
    });
  }, [lessonId]);

  useEffect(() => {
    if (!lessonId || !result?.passed) return;
    if (result.rewardsStatus === 'completed' || result.rewardsStatus === 'failed') return;

    const timer = window.setInterval(async () => {
      try {
        const status = await apiService.getQuizRewardStatus(lessonId);
        setResult((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rewardsStatus: status.rewardsStatus,
            rewardsRetryCount: status.rewardsRetryCount,
            rewardsJobId: status.rewardsJobId,
            rewardsError: status.rewardsError,
            xlmReward: status.xlmReward,
            nftCertificate: status.nftCertificate,
          };
        });
      } catch {
        // Ignore transient polling errors
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [lessonId, result?.passed, result?.rewardsStatus]);

  const currentQuestion = questions[currentQ];
  const progress = questions.length > 0 ? ((currentQ) / questions.length) * 100 : 0;

  const handleAnswer = (optionIndex: number) => {
    if (answerState !== 'idle') return;
    setSelectedAnswer(optionIndex);

    // Store answer for backend submission
    const newAnswers = [...answers, { questionId: currentQuestion.id, selectedIndex: optionIndex }];
    setAnswers(newAnswers);

    // We don't know the correct answer client-side (backend doesn't send it)
    // Show a "selected" state and move to next
    setAnswerState('correct'); // Placeholder, real result comes from backend
    setCharacterMood('happy');
    setCharacterMessage('Respuesta registrada! Siguiente...');
    setShowExplanation(false);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelectedAnswer(null);
      setAnswerState('idle');
      setShowExplanation(false);
      setCharacterMood('thinking');
      setCharacterMessage('Siguiente pregunta! Tu puedes.');
    } else {
      // Submit all answers to backend
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    if (!lessonId) return;
    setGameState('submitting');
    setCharacterMood('thinking');
    setCharacterMessage('Evaluando tus respuestas...');

    try {
      const data = await apiService.submitQuiz(lessonId, answers);
      setResult(data);
      markLessonComplete(lessonId);

      if (data.passed) {
        setCharacterMood('celebrate');
        setCharacterMessage('LO LOGRASTE! Eres increible!');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);

        // Update user XP
        if (user) {
          setUser({
            ...user,
            xp: user.xp + (data.xpEarned || 0),
            xlmEarned: (user.xlmEarned || 0),
            lessonsCompleted: (user.lessonsCompleted || 0) + 1,
          });
        }
      } else {
        setCharacterMood('thinking');
        setCharacterMessage('Intentalo de nuevo. Se que puedes mejorar!');
      }

      setGameState('finished');
    } catch (err) {
      console.error('Quiz submit failed:', err);
      setCharacterMood('wrong');
      setCharacterMessage('Hubo un error. Intentalo de nuevo.');
      setGameState('playing');
    }
  };

  const resetQuiz = () => {
    setCurrentQ(0);
    setLocalScore(0);
    setAnswers([]);
    setResult(null);
    setGameState('playing');
    setSelectedAnswer(null);
    setAnswerState('idle');
    setShowExplanation(false);
    setCharacterMood('thinking');
    setCharacterMessage('Vamos a intentarlo de nuevo!');
  };

  if (gameState === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/characters/alli.png" alt="Alli" className="float-animation" style={{ width: 100, height: 100, objectFit: 'contain', marginBottom: 16 }} />
          <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Preparando quiz...</div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        <div>
          <img src="/characters/alli.png" alt="Alli" style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 16 }} />
          <h2 style={{ marginBottom: 12 }}>Quiz no disponible</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Este quiz aun esta en preparacion</p>
          <Link to="/dashboard" className="btn btn-primary">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  if (gameState === 'submitting') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/characters/alli.png" alt="Alli" className="float-animation" style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 16 }} />
          <div style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: 8 }}>Evaluando respuestas...</div>
          <div style={{ color: 'var(--text-muted)' }}>Calculando recompensas en Stellar</div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished' && result) {
    const percentage = Math.round((result.correctCount / result.totalQuestions) * 100);

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Confetti active={showConfetti} />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}
        >
          {/* Character */}
          <div style={{ marginBottom: 32 }}>
            <CharacterReaction
              character={result.passed ? 'chima' : 'alli'}
              mood={result.passed ? 'celebrate' : 'thinking'}
              message={characterMessage}
              size="lg"
            />
          </div>

          <div className="card" style={{ padding: 40 }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: 8 }}>
              {result.passed ? 'Aprobado!' : 'Casi!'}
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '1.05rem' }}>
              {result.message}
            </p>

            {/* Score circle */}
            <div style={{
              width: 120, height: 120,
              borderRadius: '50%',
              background: result.passed ? 'rgba(46,139,63,0.15)' : 'rgba(200,39,26,0.15)',
              border: `4px solid ${result.passed ? 'var(--success)' : 'var(--danger)'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: result.passed ? 'var(--success)' : 'var(--danger)' }}>{percentage}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{result.correctCount}/{result.totalQuestions}</div>
            </div>

            {/* Rewards */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{
                background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.3)',
                borderRadius: 12, padding: '12px 20px', textAlign: 'center',
              }}>
                <Zap size={20} color="var(--accent)" style={{ marginBottom: 4 }} />
                <div style={{ fontWeight: 900, color: 'var(--accent)', fontSize: '1.3rem' }}>+{result.xpEarned}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>XP ganados</div>
              </div>
              {result.xlmReward && (
                <div style={{
                  background: 'rgba(46,139,63,0.1)', border: '1px solid rgba(46,139,63,0.3)',
                  borderRadius: 12, padding: '12px 20px', textAlign: 'center',
                }}>
                  <Star size={20} color="var(--success)" style={{ marginBottom: 4 }} />
                  <div style={{ fontWeight: 900, color: 'var(--success)', fontSize: '1.3rem' }}>+{result.xlmReward.amount}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>XLM ganados</div>
                </div>
              )}
              {result.nftCertificate && (
                <div style={{
                  background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.3)',
                  borderRadius: 12, padding: '12px 20px', textAlign: 'center',
                }}>
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: 4 }}>NFT</span>
                  <div style={{ fontWeight: 900, color: '#9B59B6', fontSize: '0.9rem' }}>Certificado</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{result.nftCertificate.status}</div>
                </div>
              )}
              {(result.rewardsStatus === 'queued' || result.rewardsStatus === 'processing') && (
                <div style={{
                  background: 'rgba(80,120,255,0.1)', border: '1px solid rgba(80,120,255,0.35)',
                  borderRadius: 12, padding: '12px 20px', textAlign: 'center',
                }}>
                  <span style={{ fontSize: '1.25rem', display: 'block', marginBottom: 4 }}>...</span>
                  <div style={{ fontWeight: 900, color: '#5078FF', fontSize: '0.9rem' }}>Recompensas</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Procesando en segundo plano</div>
                </div>
              )}
            </div>

            {result.rewardsStatus === 'failed' && (
              <div style={{
                background: 'rgba(200,39,26,0.08)',
                border: '1px solid rgba(200,39,26,0.35)',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 16,
                fontSize: '0.85rem',
                color: 'var(--danger)',
              }}>
                La entrega de recompensas fallo tras reintentos. El equipo fue notificado.
              </div>
            )}

            {/* NFT / Stellar tx notification */}
            {result.nftCertificate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(155,89,182,0.2), rgba(46,139,63,0.2))',
                  border: '1px solid rgba(155,89,182,0.4)',
                  borderRadius: 12, padding: '14px 16px',
                  marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <img src="/characters/xollo.png" alt="Xollo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>NFT Certificado en Stellar!</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    Tx: {result.nftCertificate.txHash?.substring(0, 20) || 'simulated'}...
                  </div>
                </div>
              </motion.div>
            )}

            {result.xlmReward?.txHash && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                style={{
                  background: 'rgba(46,139,63,0.1)',
                  border: '1px solid rgba(46,139,63,0.3)',
                  borderRadius: 12, padding: '12px 16px',
                  marginBottom: 24,
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                XLM Tx: <span style={{ fontFamily: 'monospace' }}>{result.xlmReward.txHash.substring(0, 24)}...</span>
              </motion.div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              {!result.passed && (
                <button onClick={resetQuiz} className="btn btn-secondary" style={{ flex: 1 }}>
                  Reintentar
                </button>
              )}
              <Link to="/dashboard" className="btn btn-primary" style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Inicio
              </Link>
              <Link to="/profile" className="btn btn-gold" style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Perfil
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/dashboard" style={{ color: 'var(--text-muted)', display: 'flex' }}>
          <X size={24} />
        </Link>
        <div style={{ flex: 1 }}>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              animate={{ width: `${progress}%` }}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          {currentQ + 1}/{questions.length}
        </div>
      </div>

      <div style={{ paddingTop: 24, paddingBottom: 40 }}>
        {/* Character */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <CharacterReaction
            character="alli"
            mood={characterMood}
            message={characterMessage}
            size="sm"
          />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <div className="card" style={{ padding: '28px 32px', marginBottom: 24, textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 12, letterSpacing: 1 }}>
                PREGUNTA {currentQ + 1}
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1.5 }}>
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {currentQuestion.options.map((option, i) => {
                const isSelected = selectedAnswer === i;
                let borderColor = 'var(--border)';
                let bg = 'var(--card)';

                if (isSelected) {
                  borderColor = 'var(--primary)';
                  bg = 'rgba(46,139,63,0.15)';
                }

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={answerState !== 'idle'}
                    style={{
                      background: bg,
                      border: `2px solid ${borderColor}`,
                      borderRadius: 14,
                      padding: '16px 20px',
                      color: 'var(--text)',
                      cursor: answerState === 'idle' ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 700,
                      fontSize: '1rem',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      width: '100%',
                    }}
                    whileHover={answerState === 'idle' ? { scale: 1.02, borderColor: 'rgba(46,139,63,0.5)' } : {}}
                    whileTap={answerState === 'idle' ? { scale: 0.98 } : {}}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: isSelected ? 'var(--primary)' : 'var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.85rem', fontWeight: 900, flexShrink: 0,
                      color: isSelected ? 'white' : 'var(--text-muted)',
                    }}>
                      {isSelected ? <CheckCircle size={18} /> : ['A', 'B', 'C', 'D'][i]}
                    </div>
                    {option}
                  </motion.button>
                );
              })}
            </div>

            {/* Next button */}
            {answerState !== 'idle' && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleNext}
                className="btn btn-primary btn-full btn-lg"
              >
                {currentQ < questions.length - 1 ? 'Siguiente' : 'Ver resultados!'}
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
