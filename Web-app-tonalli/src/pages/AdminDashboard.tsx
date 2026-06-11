import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Save, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { apiService } from '../services/api';
import type { QuestionFormItem } from '../services/api';
import type { Chapter } from '../types';

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface ModuleForm {
  id?: string;
  title: string;
  // Info section
  content: string; // JSON string with { sections, keyTerms }
  // Video section
  videoUrl: string;
  // Quiz section (structured form)
  questions: QuestionFormItem[];
}

interface ChapterForm {
  title: string;
  description: string;
  moduleTag: string;
  order: number;
  published: boolean;
  releaseWeek: string;
  estimatedMinutes: number;
  xpReward: number;
  modules: [ModuleForm, ModuleForm, ModuleForm]; // 3 lesson modules
}

const MODULE_TAGS = ['blockchain', 'stellar', 'defi', 'nft', 'wallets', 'trading', 'web3'];

const emptyQuestion = (): QuestionFormItem => ({ question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' });

const emptyModule = (title: string): ModuleForm => ({
  title,
  content: '',
  videoUrl: '',
  questions: Array(5).fill(null).map(() => emptyQuestion()),
});

const emptyForm: ChapterForm = {
  title: '',
  description: '',
  moduleTag: '',
  order: 0,
  published: false,
  releaseWeek: '',
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

    // Load questions for each lesson module from DB
    for (let i = 0; i < Math.min(lessonModules.length, 3); i++) {
      const m = lessonModules[i];
      let qs: QuestionFormItem[] = Array(5).fill(null).map(() => emptyQuestion());
      try {
        const dbQs = await apiService.adminGetModuleQuestions(m.id);
        if (dbQs.length > 0) {
          qs = dbQs.map((q: any) => ({
            question: q.question,
            options: (q.options.length === 4 ? q.options : [...q.options, '', '', '', ''].slice(0, 4)) as [string, string, string, string],
            correctIndex: q.correctIndex,
            explanation: q.explanation || '',
          }));
        }
      } catch { /* keep empty defaults */ }
      modules[i] = { id: m.id, title: m.title || `Modulo ${i + 1}`, content: m.content || '', videoUrl: m.videoUrl || '', questions: qs };
    }

    setForm({
      title: ch.title,
      description: ch.description || '',
      moduleTag: ch.moduleTag || '',
      order: ch.order,
      published: ch.published,
      releaseWeek: (ch as any).releaseWeek || '',
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

    // Validate quiz questions for each module
    for (let i = 0; i < 3; i++) {
      const mod = form.modules[i];
      const filledQs = mod.questions.filter(q => q.question.trim());
      if (filledQs.length < 5) {
        setError(`Modulo ${i + 1}: se requieren al menos 5 preguntas con texto.`);
        setExpandedModule(i);
        setActiveTab(prev => ({ ...prev, [i]: 'quiz' }));
        return;
      }
      for (const q of filledQs) {
        if (q.options.some(opt => !opt.trim())) {
          setError(`Modulo ${i + 1}: todas las opciones de cada pregunta deben estar llenas.`);
          setExpandedModule(i);
          setActiveTab(prev => ({ ...prev, [i]: 'quiz' }));
          return;
        }
      }
    }

    setSaving(true);
    setError('');
    try {
      if (editingId) {
        // Update chapter metadata
        await apiService.adminUpdateChapter(editingId, {
          title: form.title, description: form.description, moduleTag: form.moduleTag,
          order: form.order, published: form.published, releaseWeek: form.releaseWeek || undefined,
          estimatedMinutes: form.estimatedMinutes, xpReward: form.xpReward,
        });
        // Update each module content + questions
        for (const mod of form.modules) {
          if (mod.id) {
            await apiService.adminUpdateModule(mod.id, {
              title: mod.title,
              content: mod.content || undefined,
              videoUrl: mod.videoUrl || undefined,
            });
            await apiService.adminReplaceModuleQuestions(mod.id, mod.questions);
          }
        }
      } else {
        // Create chapter (auto-creates 4 modules)
        const created = await apiService.adminCreateChapter({
          title: form.title, description: form.description, moduleTag: form.moduleTag,
          order: form.order, published: form.published, releaseWeek: form.releaseWeek || undefined,
          estimatedMinutes: form.estimatedMinutes, xpReward: form.xpReward,
        });
        // Update the 3 lesson modules with content + questions
        const lessonModules = (created.modules || []).filter((m: any) => m.type === 'lesson').sort((a: any, b: any) => a.order - b.order);
        for (let i = 0; i < Math.min(lessonModules.length, 3); i++) {
          const mod = form.modules[i];
          await apiService.adminUpdateModule(lessonModules[i].id, {
            title: mod.title,
            content: mod.content || undefined,
            videoUrl: mod.videoUrl || undefined,
          });
          await apiService.adminReplaceModuleQuestions(lessonModules[i].id, mod.questions);
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

  const updateModule = (index: number, field: keyof ModuleForm, value: any) => {
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
                    {ch.requiredPlan && ch.requiredPlan !== 'free' && (
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(233,30,140,0.1)',
                          color: ch.requiredPlan === 'max' ? '#F5A623' : '#E91E8C',
                          border: `1px solid ${ch.requiredPlan === 'max' ? 'rgba(245,166,35,0.3)' : 'rgba(233,30,140,0.3)'}`,
                          fontSize: '0.68rem',
                        }}
                      >
                        Plan: {ch.requiredPlan.toUpperCase()}
                      </span>
                    )}
                    {(ch as any).releaseWeek && (
                      <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.68rem' }}>
                        Semana: {(ch as any).releaseWeek}
                      </span>
                    )}
                    {!(ch as any).releaseWeek && ch.published && (
                      <span className="badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)', fontSize: '0.68rem' }}>
                        Sin semana (acceso libre)
                      </span>
                    )}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{ch.estimatedMinutes} min · {ch.xpReward} XP</span>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Semana de liberacion (Free)</label>
                    <input className="input-field" placeholder="Ej. 2026-W12" value={form.releaseWeek} onChange={e => setForm(f => ({ ...f, releaseWeek: e.target.value }))} />
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: 2 }}>Formato: YYYY-Wnn. Free accede cuando releaseWeek &le; semana actual. Premium: +1 semana anticipada.</p>
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: 20 }}
                      onClick={() => {
                        const now = new Date();
                        const jan1 = new Date(now.getFullYear(), 0, 1);
                        const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
                        const wk = Math.ceil((days + jan1.getDay() + 1) / 7);
                        setForm(f => ({ ...f, releaseWeek: `${now.getFullYear()}-W${String(wk).padStart(2, '0')}` }));
                      }}
                    >
                      Liberar esta semana
                    </button>
                  </div>
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
                        {mod.content ? '\u2714 Lectura' : '\u25CB Lectura'} &middot; {mod.videoUrl ? '\u2714 Video' : '\u25CB Video'} &middot; {mod.questions.some(q => q.question) ? '\u2714 Quiz' : '\u25CB Quiz'}
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
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <label style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                              PREGUNTAS DEL QUIZ ({mod.questions.length}/5 minimo)
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const newQ: QuestionFormItem = { question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' };
                                updateModule(i, 'questions', [...mod.questions, newQ]);
                              }}
                              style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623', borderRadius: 8, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              + Agregar pregunta
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {mod.questions.map((q, qi) => (
                              <div key={qi} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pregunta {qi + 1}</span>
                                  {mod.questions.length > 1 && (
                                    <button type="button" onClick={() => {
                                      const updated = mod.questions.filter((_, idx) => idx !== qi);
                                      updateModule(i, 'questions', updated);
                                    }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem' }}>x Eliminar</button>
                                  )}
                                </div>
                                <input
                                  className="input-field"
                                  placeholder="Cual es...?"
                                  value={q.question}
                                  onChange={e => {
                                    const updated = [...mod.questions];
                                    updated[qi] = { ...updated[qi], question: e.target.value };
                                    updateModule(i, 'questions', updated);
                                  }}
                                  style={{ marginBottom: 10 }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                                  {q.options.map((opt, oi) => (
                                    <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <input
                                        type="radio"
                                        name={`correct-${i}-${qi}`}
                                        checked={q.correctIndex === oi}
                                        onChange={() => {
                                          const updated = [...mod.questions];
                                          updated[qi] = { ...updated[qi], correctIndex: oi };
                                          updateModule(i, 'questions', updated);
                                        }}
                                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#00D4AA', flexShrink: 0 }}
                                        title="Marcar como correcta"
                                      />
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: 16, flexShrink: 0 }}>
                                        {String.fromCharCode(65 + oi)}
                                      </span>
                                      <input
                                        className="input-field"
                                        placeholder={`Opcion ${String.fromCharCode(65 + oi)}`}
                                        value={opt}
                                        onChange={e => {
                                          const updated = [...mod.questions];
                                          const newOpts = [...updated[qi].options] as [string, string, string, string];
                                          newOpts[oi] = e.target.value;
                                          updated[qi] = { ...updated[qi], options: newOpts };
                                          updateModule(i, 'questions', updated);
                                        }}
                                        style={{ flex: 1, border: q.correctIndex === oi ? '1.5px solid #00D4AA' : '1px solid var(--border)' }}
                                      />
                                    </div>
                                  ))}
                                  <p style={{ fontSize: '0.7rem', color: '#00D4AA', margin: 0 }}>Radio = Respuesta correcta</p>
                                </div>
                                <input
                                  className="input-field"
                                  placeholder="Explicacion (se muestra al terminar el quiz)"
                                  value={q.explanation}
                                  onChange={e => {
                                    const updated = [...mod.questions];
                                    updated[qi] = { ...updated[qi], explanation: e.target.value };
                                    updateModule(i, 'questions', updated);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          {mod.questions.length < 5 && (
                            <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 8 }}>Se requieren al menos 5 preguntas</p>
                          )}
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
