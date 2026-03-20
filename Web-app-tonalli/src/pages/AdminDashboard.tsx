import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Save, X, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';
import type { Chapter } from '../types';

type FormState = {
  title: string;
  description: string;
  content: string;
  moduleTag: string;
  order: number;
  published: boolean;
  estimatedMinutes: number;
  xpReward: number;
};

const emptyForm: FormState = {
  title: '',
  description: '',
  content: '',
  moduleTag: '',
  order: 0,
  published: false,
  estimatedMinutes: 5,
  xpReward: 50,
};

const MODULE_TAGS = ['blockchain', 'stellar', 'defi', 'nft', 'wallets', 'trading', 'web3'];

export function AdminDashboard() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await apiService.adminGetChapters();
      setChapters(data);
    } catch {
      setError('No se pudo cargar los capítulos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (ch: Chapter) => {
    setEditingId(ch.id);
    setForm({
      title: ch.title,
      description: ch.description || '',
      content: ch.content || '',
      moduleTag: ch.moduleTag || '',
      order: ch.order,
      published: ch.published,
      estimatedMinutes: ch.estimatedMinutes || 5,
      xpReward: ch.xpReward || 50,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('El título es requerido.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await apiService.adminUpdateChapter(editingId, form as Record<string, unknown>);
      } else {
        await apiService.adminCreateChapter(form);
      }
      await load();
      closeForm();
    } catch {
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await apiService.adminTogglePublish(id);
      setChapters(prev => prev.map(c => c.id === id ? { ...c, published: !c.published } : c));
    } catch {
      setError('Error al cambiar estado.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.adminDeleteChapter(id);
      setChapters(prev => prev.filter(c => c.id !== id));
      setDeleteConfirm(null);
    } catch {
      setError('Error al eliminar.');
    }
  };

  const published = chapters.filter(c => c.published).length;
  const drafts = chapters.filter(c => !c.published).length;

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em', marginBottom: 6 }}>
              Panel de Administración
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Gestiona los capítulos de contenido de Tonalli
            </p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Nuevo capítulo
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total capítulos', value: chapters.length, color: 'var(--text)' },
            { label: 'Publicados', value: published, color: 'var(--success)' },
            { label: 'Borradores', value: drafts, color: 'var(--text-muted)' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color, fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {error && !showForm && (
          <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 8, padding: '12px 16px', color: 'var(--danger)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Chapter list */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>Cargando...</div>
        ) : chapters.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <BookOpen size={40} style={{ color: 'var(--text-subtle)', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)' }}>No hay capítulos aún. Crea el primero.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {chapters.map((ch) => (
              <motion.div
                key={ch.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}
              >
                {/* Order badge */}
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {ch.order}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ch.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    {ch.moduleTag && (
                      <span className="badge badge-blue">{ch.moduleTag}</span>
                    )}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                      {ch.estimatedMinutes} min · {ch.xpReward} XP
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: ch.published ? 'rgba(63,185,80,0.1)' : 'rgba(125,133,144,0.1)',
                  border: `1px solid ${ch.published ? 'rgba(63,185,80,0.25)' : 'rgba(125,133,144,0.2)'}`,
                  borderRadius: 5, padding: '3px 10px',
                  fontSize: '0.72rem', fontWeight: 600,
                  color: ch.published ? 'var(--success)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {ch.published ? <Eye size={12} /> : <EyeOff size={12} />}
                  {ch.published ? 'Publicado' : 'Borrador'}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleTogglePublish(ch.id)}
                    title={ch.published ? 'Despublicar' : 'Publicar'}
                  >
                    {ch.published ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(ch)} title="Editar">
                    <Pencil size={14} />
                  </button>
                  {deleteConfirm === ch.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ch.id)}>
                        Confirmar
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(ch.id)} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Form Modal ─────────────────────────────────────────────────────────── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-active)',
              borderRadius: 12,
              width: '100%', maxWidth: 640,
              maxHeight: '90vh',
              overflow: 'auto',
              padding: 28,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                {editingId ? 'Editar capítulo' : 'Nuevo capítulo'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={closeForm}><X size={16} /></button>
            </div>

            {error && (
              <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 7, padding: '10px 14px', color: 'var(--danger)', marginBottom: 18, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 7 }}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input
                  className="input-field"
                  placeholder="Ej. Introducción al Blockchain"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input
                  className="input-field"
                  placeholder="Breve descripción del capítulo"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contenido</label>
                <textarea
                  className="input-field"
                  placeholder="Escribe el contenido completo del capítulo aquí..."
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  style={{ minHeight: 160, resize: 'vertical', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Módulo / Tag</label>
                  <select
                    className="input-field"
                    value={form.moduleTag}
                    onChange={e => setForm(f => ({ ...f, moduleTag: e.target.value }))}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">Sin categoría</option>
                    {MODULE_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Orden</label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                    min={0}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duración (min)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.estimatedMinutes}
                    onChange={e => setForm(f => ({ ...f, estimatedMinutes: Number(e.target.value) }))}
                    min={1}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">XP Reward</label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.xpReward}
                    onChange={e => setForm(f => ({ ...f, xpReward: Number(e.target.value) }))}
                    min={0}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="published"
                  checked={form.published}
                  onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="published" style={{ fontSize: '0.88rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  Publicar capítulo (visible para usuarios)
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={closeForm}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : <><Save size={15} /> {editingId ? 'Guardar cambios' : 'Crear capítulo'}</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
