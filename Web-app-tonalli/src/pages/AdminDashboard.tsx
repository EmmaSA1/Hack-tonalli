import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Save, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { apiService } from '../services/api';
import type { Chapter } from '../types';

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface ModuleForm {
  id?: string;
  title: string;
  // Info section
  content: string; // JSON string with { sections, keyTerms }
  // Video section
  videoUrl: string;
  // Quiz section (JSON array of questions)
  questionsRaw: string; // user-friendly text to edit
}

interface ChapterForm {
  title: string;
  description: string;
  moduleTag: string;
  order: number;
  published: boolean;
  estimatedMinutes: number;
  xpReward: number;
  modules: [ModuleForm, ModuleForm, ModuleForm]; // 3 lesson modules
}

const MODULE_TAGS = ['blockchain', 'stellar', 'defi', 'nft', 'wallets', 'trading', 'web3'];

const emptyModule = (title: string): ModuleForm => ({
  title,
  content: '',
  videoUrl: '',
  questionsRaw: '',
});

const emptyForm: ChapterForm = {
  title: '',
  description: '',
  moduleTag: '',
  order: 0,
  published: false,
  estimatedMinutes: 15,
  xpReward: 140,
  modules: [
    emptyModule('Modulo 1'),
    emptyModule('Modulo 2'),
    emptyModule('Modulo 3'),
  ],
};

/* ── Component ──────────────────────────────────────────────────────────────── */

export function AdminDashboard() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChapterForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [expandedModule, setExpandedModule] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<Record<number, 'info' | 'video' | 'quiz'>>({ 0: 'info', 1: 'info', 2: 'info' });

  const load = async () => {
    try {
      const data = await apiService.adminGetChapters();
      setChapters(data);
    } catch { setError('No se pudo cargar los capítulos.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setExpandedModule(0);
    setShowForm(true);
  };

  const openEdit = async (ch: Chapter) => {
    setEditingId(ch.id);

    // Load chapter with modules
    const full = await apiService.getChapter(ch.id);
    const lessonModules = (full.modules || []).filter((m: any) => m.type === 'lesson').sort((a: any, b: any) => a.order - b.order);

    const modules: [ModuleForm, ModuleForm, ModuleForm] = [
      emptyModule('Modulo 1'),
      emptyModule('Modulo 2'),
      emptyModule('Modulo 3'),
    ];

    lessonModules.forEach((m: any, i: number) => {
      if (i < 3) {
        modules[i] = {
          id: m.id,
          title: m.title || `Modulo ${i + 1}`,
          content: m.content || '',
          videoUrl: m.videoUrl || '',
          questionsRaw: m.questionsPool || '',
        };
      }
    });

    setForm({
      title: ch.title,
      description: ch.description || '',
      moduleTag: ch.moduleTag || '',
      order: ch.order,
      published: ch.published,
      estimatedMinutes: ch.estimatedMinutes || 15,
      xpReward: ch.xpReward || 140,
      modules,
    });
    setExpandedModule(0);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); setError(''); };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('El titulo es requerido.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        // Update chapter metadata
        await apiService.adminUpdateChapter(editingId, {
          title: form.title, description: form.description, moduleTag: form.moduleTag,
          order: form.order, published: form.published,
          estimatedMinutes: form.estimatedMinutes, xpReward: form.xpReward,
        });
        // Update each module
        for (const mod of form.modules) {
          if (mod.id) {
            await apiService.adminUpdateModule(mod.id, {
              title: mod.title,
              content: mod.content || undefined,
              videoUrl: mod.videoUrl || undefined,
              questionsPool: mod.questionsRaw || undefined,
            });
          }
        }
      } else {
        // Create chapter (auto-creates 4 modules)
        const created = await apiService.adminCreateChapter({
          title: form.title, description: form.description, moduleTag: form.moduleTag,
          order: form.order, published: form.published,
          estimatedMinutes: form.estimatedMinutes, xpReward: form.xpReward,
        });
        // Update the 3 lesson modules with content
        const lessonModules = (created.modules || []).filter((m: any) => m.type === 'lesson').sort((a: any, b: any) => a.order - b.order);
        for (let i = 0; i < Math.min(lessonModules.length, 3); i++) {
          const mod = form.modules[i];
          await apiService.adminUpdateModule(lessonModules[i].id, {
            title: mod.title,
            content: mod.content || undefined,
            videoUrl: mod.videoUrl || undefined,
            questionsPool: mod.questionsRaw || undefined,
          });
        }
      }
      await load();
      closeForm();
    } catch { setError('Error al guardar.'); }
    finally { setSaving(false); }
  };

  const handleTogglePublish = async (id: string) => {
    try { await apiService.adminTogglePublish(id); setChapters(prev => prev.map(c => c.id === id ? { ...c, published: !c.published } : c)); }
    catch { setError('Error al cambiar estado.'); }
  };

  const handleDelete = async (id: string) => {
    try { await apiService.adminDeleteChapter(id); setChapters(prev => prev.filter(c => c.id !== id)); setDeleteConfirm(null); }
    catch { setError('Error al eliminar.'); }
  };

  const updateModule = (index: number, field: keyof ModuleForm, value: string) => {
    setForm(f => {
      const mods = [...f.modules] as [ModuleForm, ModuleForm, ModuleForm];
      mods[index] = { ...mods[index], [field]: value };
      return { ...f, modules: mods };
    });
  };

  const published = chapters.filter(c => c.published).length;
  const drafts = chapters.filter(c => !c.published).length;

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Panel de Administracion</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestiona capitulos: cada uno tiene 3 modulos (info+video+quiz) + examen final</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Nuevo capitulo</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total capitulos', value: chapters.length, color: 'var(--text)' },
            { label: 'Publicados', value: published, color: 'var(--success)' },
            { label: 'Borradores', value: drafts, color: 'var(--text-muted)' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.value}</div>
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
            <p style={{ color: 'var(--text-muted)' }}>No hay capitulos aun. Crea el primero.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {chapters.map((ch) => (
              <motion.div key={ch.id} layout className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>{ch.order}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.title}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    {ch.moduleTag && <span className="badge badge-blue">{ch.moduleTag}</span>}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{ch.estimatedMinutes} min · {ch.xpReward} XP</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{(ch as any).modules?.length || 4} modulos</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: ch.published ? 'rgba(63,185,80,0.1)' : 'rgba(125,133,144,0.1)', border: `1px solid ${ch.published ? 'rgba(63,185,80,0.25)' : 'rgba(125,133,144,0.2)'}`, borderRadius: 5, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600, color: ch.published ? 'var(--success)' : 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {ch.published ? <Eye size={12} /> : <EyeOff size={12} />}
                  {ch.published ? 'Publicado' : 'Borrador'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleTogglePublish(ch.id)} title={ch.published ? 'Despublicar' : 'Publicar'}>{ch.published ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(ch)} title="Editar"><Pencil size={14} /></button>
                  {deleteConfirm === ch.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ch.id)}>Confirmar</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}><X size={14} /></button>
                    </div>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(ch.id)} title="Eliminar"><Trash2 size={14} /></button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Form Modal ─────────────────────────────────────────────────────────── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: 12, width: '100%', maxWidth: 900, padding: 28, marginTop: 20, marginBottom: 40 }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingId ? 'Editar capitulo' : 'Nuevo capitulo'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={closeForm}><X size={16} /></button>
            </div>

            {error && (
              <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 7, padding: '10px 14px', color: 'var(--danger)', marginBottom: 18, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 7 }}><AlertTriangle size={14} /> {error}</div>
            )}

            {/* ── Chapter metadata ───────────────────────────────────────────────── */}
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: 20, marginBottom: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)' }}>DATOS DEL CAPITULO</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Titulo del capitulo *</label>
                  <input className="input-field" placeholder="Ej. Introduccion al Blockchain" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripcion</label>
                  <input className="input-field" placeholder="Breve descripcion del capitulo" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Tag</label>
                    <select className="input-field" value={form.moduleTag} onChange={e => setForm(f => ({ ...f, moduleTag: e.target.value }))} style={{ cursor: 'pointer' }}>
                      <option value="">Sin tag</option>
                      {MODULE_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Orden</label>
                    <input type="number" className="input-field" value={form.order} onChange={e => setForm(f => ({ ...f, order: +e.target.value }))} min={0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duracion (min)</label>
                    <input type="number" className="input-field" value={form.estimatedMinutes} onChange={e => setForm(f => ({ ...f, estimatedMinutes: +e.target.value }))} min={1} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">XP Total</label>
                    <input type="number" className="input-field" value={form.xpReward} onChange={e => setForm(f => ({ ...f, xpReward: +e.target.value }))} min={0} />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                  Publicar (visible para usuarios)
                </label>
              </div>
            </div>

            {/* ── 3 Lesson Modules ──────────────────────────────────────────────── */}
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)' }}>MODULOS (cada uno tiene: Lectura + Video + Quiz de 5 preguntas)</h3>

            {form.modules.map((mod, i) => {
              const isExpanded = expandedModule === i;
              const tab = activeTab[i] || 'info';
              return (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
                  {/* Module header */}
                  <button
                    onClick={() => setExpandedModule(isExpanded ? -1 : i)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: isExpanded ? 'var(--bg-subtle)' : 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', textAlign: 'left' }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{mod.title || `Modulo ${i + 1}`}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {mod.content ? '\u2714 Lectura' : '\u25CB Lectura'} &middot; {mod.videoUrl ? '\u2714 Video' : '\u25CB Video'} &middot; {mod.questionsRaw ? '\u2714 Quiz' : '\u25CB Quiz'}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {/* Module content */}
                  {isExpanded && (
                    <div style={{ padding: '0 16px 16px' }}>
                      {/* Module title */}
                      <div className="form-group" style={{ marginBottom: 12 }}>
                        <label className="form-label">Titulo del modulo</label>
                        <input className="input-field" placeholder={`Ej. Que es Blockchain?`} value={mod.title} onChange={e => updateModule(i, 'title', e.target.value)} />
                      </div>

                      {/* Section tabs */}
                      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                        {[
                          { key: 'info' as const, label: '\uD83D\uDCDA Lectura', color: '#3b82f6' },
                          { key: 'video' as const, label: '\uD83C\uDFAC Video', color: '#8b5cf6' },
                          { key: 'quiz' as const, label: '\uD83D\uDCDD Quiz (5 preguntas)', color: '#f59e0b' },
                        ].map(t => (
                          <button
                            key={t.key}
                            onClick={() => setActiveTab(prev => ({ ...prev, [i]: t.key }))}
                            style={{
                              flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                              background: tab === t.key ? `${t.color}20` : 'var(--bg-subtle)',
                              color: tab === t.key ? t.color : 'var(--text-muted)',
                              border: tab === t.key ? `2px solid ${t.color}40` : '1px solid var(--border)',
                            }}
                          >{t.label}</button>
                        ))}
                      </div>

                      {/* Info tab */}
                      {tab === 'info' && (
                        <div>
                          <label className="form-label">Contenido de lectura (texto plano)</label>
                          <textarea
                            className="input-field"
                            placeholder={'¿Que es Blockchain?\n\nUna blockchain es un registro distribuido e inmutable...\n\nCaracteristicas principales:\n• Descentralizada\n• Inmutable\n• Transparente\n• Segura\n\nTerminos clave:\n• Bloque: unidad de datos en la cadena\n• Hash: huella digital unica'}
                            value={mod.content}
                            onChange={e => updateModule(i, 'content', e.target.value)}
                            style={{ minHeight: 250, resize: 'vertical', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', lineHeight: 1.7 }}
                          />
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: 4 }}>Escribe el contenido como texto normal. Usa doble salto de linea para separar parrafos. Usa • para listas.</p>
                        </div>
                      )}

                      {/* Video tab */}
                      {tab === 'video' && (
                        <div>
                          <label className="form-label">URL del video</label>
                          <input className="input-field" placeholder="https://..." value={mod.videoUrl} onChange={e => updateModule(i, 'videoUrl', e.target.value)} />
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: 4 }}>El usuario debe ver el 90% del video para completar esta seccion. Dejar vacio para omitir.</p>
                        </div>
                      )}

                      {/* Quiz tab */}
                      {tab === 'quiz' && (
                        <div>
                          <label className="form-label">Preguntas del quiz (JSON array, 5+ preguntas)</label>
                          <textarea
                            className="input-field"
                            placeholder={'[\n  {\n    "id": "q1",\n    "question": "Pregunta?",\n    "options": ["A", "B", "C", "D"],\n    "correctIndex": 0,\n    "explanation": "Explicacion..."\n  }\n]'}
                            value={mod.questionsRaw}
                            onChange={e => updateModule(i, 'questionsRaw', e.target.value)}
                            style={{ minHeight: 200, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.5 }}
                          />
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: 4 }}>
                            Minimo 5 preguntas. correctIndex: 0=A, 1=B, 2=C, 3=D. Las preguntas y opciones se mezclan automaticamente en cada intento.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Module 4 info */}
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '1.2rem' }}>{'\uD83C\uDFC6'}</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f59e0b' }}>Modulo 4 — Examen Final</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Se genera automaticamente con 10 preguntas mezcladas de los 3 modulos anteriores. No necesitas configurarlo manualmente.
              </p>
            </div>

            {/* Save */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={closeForm}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : <><Save size={15} /> {editingId ? 'Guardar cambios' : 'Crear capitulo'}</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
