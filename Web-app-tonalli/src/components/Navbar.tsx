import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { Zap, LogOut, Trophy, LayoutDashboard, BookOpen, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { dailyStreak } = useProgressStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.nav
      className="glass"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
      }}
      initial={{ y: -56 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Logo */}
      <Link
        to={isAuthenticated ? '/dashboard' : '/'}
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9 }}
      >
        <img
          src="/logo.png"
          alt="Tonalli"
          style={{ width: 28, height: 28, objectFit: 'contain' }}
        />
        <span style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: '-0.02em',
          color: 'var(--text)',
        }}>
          Tonalli
        </span>
      </Link>

      {/* Right */}
      {isAuthenticated && user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Streak */}
          {dailyStreak > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(200,39,26,0.1)',
              padding: '5px 10px', borderRadius: 6,
              border: '1px solid rgba(200,39,26,0.2)',
            }}>
              <span className="streak-fire" style={{ fontSize: '0.95rem' }}>🔥</span>
              <span style={{ fontWeight: 600, color: '#e05c52', fontSize: '0.85rem' }}>{dailyStreak}</span>
            </div>
          )}

          {/* XP */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(201,146,10,0.1)',
            padding: '5px 10px', borderRadius: 6,
            border: '1px solid rgba(201,146,10,0.2)',
          }}>
            <Zap size={13} color="var(--accent-light)" />
            <span style={{ fontWeight: 600, color: 'var(--accent-light)', fontSize: '0.85rem' }}>
              {user.xp.toLocaleString()}
            </span>
          </div>

          {/* Nav links */}
          <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', padding: '6px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }} title="Dashboard">
            <LayoutDashboard size={17} />
          </Link>

          <Link to="/chapters" style={{ color: 'var(--text-muted)', textDecoration: 'none', padding: '6px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }} title="Capítulos">
            <BookOpen size={17} />
          </Link>

          <Link to="/leaderboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', padding: '6px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }} title="Ranking">
            <Trophy size={17} />
          </Link>

          {user?.role === 'admin' && (
            <Link to="/admin" style={{ color: 'var(--accent-light)', textDecoration: 'none', padding: '6px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }} title="Panel Admin">
              <Shield size={17} />
            </Link>
          )}

          {/* Avatar */}
          <Link to="/profile" style={{ textDecoration: 'none', marginLeft: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.78rem', fontWeight: 700, color: '#fff',
              border: '1.5px solid var(--border-active)',
              cursor: 'pointer',
            }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px 8px', marginLeft: 2 }}
            title="Cerrar sesión"
          >
            <LogOut size={15} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/login" className="btn btn-ghost btn-sm">Iniciar sesión</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Registrarse</Link>
        </div>
      )}
    </motion.nav>
  );
}
