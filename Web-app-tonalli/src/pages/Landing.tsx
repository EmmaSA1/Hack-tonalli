import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Users, BookOpen, Coins, Shield, Zap, Globe } from 'lucide-react';

const fadeUp = {
  initial: { y: 32, opacity: 0 },
  animate: { y: 0, opacity: 1 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export function Landing() {
  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Hero ───────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle grid background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.18,
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
        }} />

        {/* Glow blobs */}
        <div style={{
          position: 'absolute', top: '15%', left: '8%',
          width: 480, height: 480,
          background: 'radial-gradient(circle, rgba(26,127,75,0.12) 0%, transparent 68%)',
          borderRadius: '50%', pointerEvents: 'none', filter: 'blur(2px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '8%',
          width: 360, height: 360,
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 68%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        {/* Characters */}
        <motion.div
          style={{ display: 'flex', gap: 20, marginBottom: 40, alignItems: 'flex-end' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <motion.img
            src="/characters/alli.png"
            alt="Alli"
            className="float-delay"
            style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 8px 18px rgba(201,146,10,0.4))' }}
            whileHover={{ scale: 1.08, rotate: -4 }}
            draggable={false}
          />
          <motion.img
            src="/characters/xollo.png"
            alt="Xollo"
            className="float-slow"
            style={{ width: 140, height: 140, objectFit: 'contain', filter: 'drop-shadow(0 12px 26px rgba(139,92,246,0.4))' }}
            whileHover={{ scale: 1.08 }}
            draggable={false}
          />
          <motion.img
            src="/characters/chima.png"
            alt="Chima"
            className="float-delay2"
            style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 8px 18px rgba(200,39,26,0.4))' }}
            whileHover={{ scale: 1.08, rotate: 4 }}
            draggable={false}
          />
        </motion.div>

        <motion.div
          initial={{ y: 36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="badge badge-primary" style={{ marginBottom: 20 }}>
            Powered by Stellar Blockchain
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 4.5vw, 3.6rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: 20,
            maxWidth: 780,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.02em',
            color: 'var(--text)',
          }}>
            Aprende Web3 en español
            <br />
            <span className="gradient-text">y gana recompensas reales</span>
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-muted)',
            maxWidth: 520,
            margin: '0 auto 36px',
            lineHeight: 1.75,
            fontWeight: 400,
          }}>
            La plataforma educativa Web3 para México y Latinoamérica.
            Completa lecciones, pasa quizzes y gana XLM real en Stellar.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Empieza gratis <ChevronRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Iniciar sesión
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          style={{
            display: 'flex', gap: 40, marginTop: 64,
            justifyContent: 'center', flexWrap: 'wrap',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {[
            { icon: <Users size={16} />, value: '12,000+', label: 'Estudiantes activos' },
            { icon: <BookOpen size={16} />, value: '40+',     label: 'Lecciones gratuitas' },
            { icon: <Coins size={16} />,   value: '500 XLM',  label: 'Distribuidos en red' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--primary)', justifyContent: 'center', marginBottom: 6 }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 52 }}
          >
            <h2 style={{ fontSize: '1.9rem', fontWeight: 700, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              Cómo funciona
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Tres pasos para convertirte en experto Web3</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}
          >
            {[
              {
                step: '01',
                icon: <BookOpen size={22} />,
                title: 'Aprende',
                accent: 'var(--success)',
                description: 'Lecciones cortas sobre blockchain, Stellar, DeFi y NFTs. En español, con ejemplos aplicados a México y LATAM.',
                cta: 'Chima te guía',
                char: 'chima',
              },
              {
                step: '02',
                icon: <Zap size={22} />,
                title: 'Completa quizzes',
                accent: 'var(--accent-light)',
                description: 'Pon a prueba tu conocimiento. Cada respuesta correcta suma XP y te acerca a lecciones avanzadas.',
                cta: 'Alli te desafía',
                char: 'alli',
              },
              {
                step: '03',
                icon: <Coins size={22} />,
                title: 'Gana recompensas',
                accent: 'var(--purple)',
                description: 'Completa módulos y recibe XLM real en tu wallet Stellar. Además obtén certificados NFT on-chain.',
                cta: 'Xollo cuida tu racha',
                char: 'xollo',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="card"
                style={{ padding: 28, position: 'relative', overflow: 'hidden' }}
                whileHover={{ y: -4, borderColor: 'var(--border-active)' }}
              >
                {/* White frosted shimmer */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 56,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.055) 0%, transparent 100%)',
                  borderRadius: '10px 10px 0 0',
                  pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <div style={{
                    width: 38, height: 38,
                    borderRadius: 8,
                    background: `${feature.accent}18`,
                    border: `1px solid ${feature.accent}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: feature.accent,
                    flexShrink: 0,
                  }}>
                    {feature.icon}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-subtle)', letterSpacing: '0.1em' }}>
                    PASO {feature.step}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: 18 }}>
                  {feature.description}
                </p>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  fontSize: '0.8rem', fontWeight: 500, color: feature.accent,
                  background: `${feature.accent}12`,
                  border: `1px solid ${feature.accent}25`,
                  padding: '5px 12px', borderRadius: 5,
                }}>
                  <img
                    src={`/characters/${feature.char}.png`}
                    alt=""
                    style={{ width: 20, height: 20, objectFit: 'contain' }}
                    draggable={false}
                  />
                  {feature.cta}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Characters ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 52 }}
          >
            <h2 style={{ fontSize: '1.9rem', fontWeight: 700, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              Conoce a tu equipo
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Tus compañeros en el viaje Web3</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              {
                image: '/characters/chima.png',
                name: 'Chima',
                role: 'Guía Maestra',
                accent: '#C8271A',
                glow: 'rgba(200,39,26,0.3)',
                description: 'Mariachi de corazón, maestra de blockchain. Chima explica cada concepto con claridad y paciencia. Nunca te deja atrás.',
                animClass: 'float-animation',
              },
              {
                image: '/characters/alli.png',
                name: 'Alli',
                role: 'Desafiador',
                accent: 'var(--accent-light)',
                glow: 'rgba(201,146,10,0.3)',
                description: 'El más competitivo del metaverso. Alli te reta constantemente a superar tus récords y mejorar tu racha.',
                animClass: 'float-slow',
              },
              {
                image: '/characters/xollo.png',
                name: 'Xollo',
                role: 'Guardián de Racha',
                accent: 'var(--purple)',
                glow: 'rgba(139,92,246,0.3)',
                description: 'El xoloescuincle más leal de la blockchain. Cuida tu racha diaria y celebra contigo cada logro.',
                animClass: 'float-delay',
              },
            ].map((char, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="card"
                style={{ textAlign: 'center', padding: 28 }}
                whileHover={{ y: -5, borderColor: 'var(--border-active)' }}
              >
                <motion.div
                  style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}
                  whileHover={{ scale: 1.06 }}
                >
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 90, height: 90, borderRadius: '50%',
                    background: `radial-gradient(circle, ${char.glow}, transparent 70%)`,
                    filter: 'blur(14px)', pointerEvents: 'none',
                  }} />
                  <img
                    src={char.image}
                    alt={char.name}
                    className={char.animClass}
                    draggable={false}
                    style={{ width: 120, height: 120, objectFit: 'contain', position: 'relative', filter: `drop-shadow(0 8px 18px ${char.glow})` }}
                  />
                </motion.div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {char.name}
                </h3>
                <div className="badge" style={{
                  background: `${char.accent}15`,
                  color: char.accent,
                  border: `1px solid ${char.accent}30`,
                  marginBottom: 12,
                }}>
                  {char.role}
                </div>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.88rem' }}>
                  {char.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Topics ─────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 44 }}
          >
            <h2 style={{ fontSize: '1.9rem', fontWeight: 700, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              Temario completo
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>De principiante a experto en Web3</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { icon: <Shield size={16} />,  topic: 'Blockchain Básico',   level: 'Principiante', accent: 'var(--success)' },
              { icon: <Coins size={16} />,   topic: 'Stellar & XLM',       level: 'Principiante', accent: 'var(--accent-light)' },
              { icon: <Zap size={16} />,     topic: 'Wallets & Seguridad', level: 'Intermedio',   accent: 'var(--blue)' },
              { icon: <Globe size={16} />,   topic: 'DeFi en México',      level: 'Intermedio',   accent: 'var(--purple)' },
              { icon: <Coins size={16} />,   topic: 'NFTs & Arte Digital', level: 'Avanzado',     accent: '#e879f9' },
              { icon: <Shield size={16} />,  topic: 'Smart Contracts',     level: 'Avanzado',     accent: 'var(--danger)' },
              { icon: <BookOpen size={16} />,topic: 'Trading Responsable', level: 'Intermedio',   accent: 'var(--success)' },
              { icon: <Globe size={16} />,   topic: 'Web3 y Sociedad',     level: 'Todos',        accent: 'var(--text-muted)' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="card"
                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'default' }}
                whileHover={{ borderColor: 'var(--border-active)', y: -2 }}
              >
                <div style={{ color: item.accent, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{item.topic}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: 2 }}>{item.level}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div style={{ marginBottom: 28, position: 'relative', display: 'inline-block' }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 100, height: 100, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%)',
              filter: 'blur(18px)', pointerEvents: 'none',
            }} />
            <img
              src="/characters/xollo.png"
              alt="Xollo"
              className="float-slow"
              style={{ width: 130, height: 130, objectFit: 'contain', position: 'relative', filter: 'drop-shadow(0 10px 24px rgba(139,92,246,0.5))' }}
              draggable={false}
            />
          </div>

          <h2 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: 14, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
            Xollo está esperándote
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Únete a miles de usuarios que ya están aprendiendo Web3 y ganando recompensas reales en Stellar.
          </p>

          <Link to="/register" className="btn btn-primary btn-lg pulse-glow">
            Crear cuenta gratis <ChevronRight size={18} />
          </Link>
          <p style={{ marginTop: 14, color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
            
          </p>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '28px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.png" alt="Tonalli" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          <span style={{ fontWeight: 600, fontSize: '0.88rem', fontFamily: "'Space Grotesk', sans-serif" }}>Tonalli</span>
        </div>
        <div style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>
          Built on Stellar Blockchain · 2024
        </div>
      </footer>
    </div>
  );
}
