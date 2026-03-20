import { motion, AnimatePresence } from 'framer-motion';

type Character = 'chima' | 'alli' | 'xollo';
type Mood = 'idle' | 'happy' | 'excited' | 'thinking' | 'wrong' | 'celebrate';

interface CharacterReactionProps {
  character: Character;
  mood: Mood;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CHARACTER_IMAGES: Record<Character, string> = {
  chima: '/characters/chima.png',
  alli: '/characters/alli.png',
  xollo: '/characters/xollo.png',
};

const CHARACTER_NAMES: Record<Character, string> = {
  chima: 'Chima',
  alli: 'Alli',
  xollo: 'Xollo',
};

const CHARACTER_ROLES: Record<Character, string> = {
  chima: 'Tu guia',
  alli: 'El retador',
  xollo: 'Guardian de rachas',
};

const MOOD_CLASSES: Record<Mood, string> = {
  idle: 'char-idle',
  happy: 'char-happy',
  excited: 'char-excited',
  thinking: 'char-thinking',
  wrong: 'char-wrong',
  celebrate: 'char-celebrate',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOOD_VARIANTS: Record<Mood, any> = {
  idle: {
    y: [0, -8, 0],
    rotate: [0, 1, -1, 0],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
  happy: {
    scale: [0.8, 1.1, 0.95, 1],
    y: [0, -15, 0],
    transition: { duration: 0.6, ease: 'easeOut' },
  },
  excited: {
    scale: [1, 1.15, 0.9, 1.1, 1],
    rotate: [0, -8, 8, -5, 0],
    y: [0, -20, -5, -15, 0],
    transition: { duration: 0.8, ease: 'easeOut' },
  },
  thinking: {
    rotate: [0, -5, 5, -3, 0],
    scale: [1, 0.97, 1.02, 1],
    transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  },
  wrong: {
    x: [0, -12, 12, -8, 8, -4, 0],
    rotate: [0, -5, 5, -3, 3, 0],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
  celebrate: {
    y: [0, -25, 0, -18, 0, -10, 0],
    scale: [1, 1.2, 1, 1.15, 1, 1.08, 1],
    rotate: [0, -10, 10, -8, 8, -3, 0],
    transition: { duration: 1.2, ease: 'easeOut' },
  },
};

const IMAGE_SIZES: Record<string, { width: number; height: number }> = {
  sm: { width: 80, height: 80 },
  md: { width: 130, height: 130 },
  lg: { width: 200, height: 200 },
};

export function CharacterReaction({ character, mood, message, size = 'md' }: CharacterReactionProps) {
  const imageSrc = CHARACTER_IMAGES[character];
  const name = CHARACTER_NAMES[character];
  const role = CHARACTER_ROLES[character];
  const moodClass = MOOD_CLASSES[mood];
  const moodVariant = MOOD_VARIANTS[mood];
  const imgSize = IMAGE_SIZES[size];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${character}-${mood}`}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.35, type: 'spring', stiffness: 180, damping: 15 }}
        className="character-reaction-wrapper"
      >
        {/* Glow ring behind character */}
        <div className={`character-glow character-glow--${character} ${moodClass}`} />

        {/* Character image with mood animation */}
        <motion.div
          className={`character-container ${moodClass}`}
          animate={moodVariant}
        >
          <img
            src={imageSrc}
            alt={name}
            width={imgSize.width}
            height={imgSize.height}
            className="character-img"
            draggable={false}
          />

          {/* Mood particles */}
          {(mood === 'celebrate' || mood === 'excited') && (
            <div className="character-particles">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="particle" style={{ '--i': i } as React.CSSProperties} />
              ))}
            </div>
          )}

          {mood === 'happy' && (
            <div className="character-sparkles">
              {[...Array(3)].map((_, i) => (
                <span key={i} className="sparkle" style={{ '--i': i } as React.CSSProperties} />
              ))}
            </div>
          )}

          {mood === 'thinking' && (
            <div className="character-dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          )}

          {mood === 'wrong' && (
            <div className="character-sweat">
              <span className="sweat-drop" />
            </div>
          )}
        </motion.div>

        {/* Speech bubble */}
        {message && (
          <motion.div
            initial={{ y: 12, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
            className="character-bubble"
          >
            <div className="bubble-tail" />
            <span className="bubble-name">{name}</span>
            <span className="bubble-role">{role}</span>
            <p className="bubble-message">{message}</p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
