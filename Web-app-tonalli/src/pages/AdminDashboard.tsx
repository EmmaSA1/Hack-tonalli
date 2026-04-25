import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Save, X, AlertTriangle, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Users, BarChart2, Zap } from 'lucide-react';
import { apiService } from '../services/api';
import type { QuestionFormItem } from '../services/api';
import type { Chapter } from '../types';

/*  Types  */

interface ModuleForm {
  id?: string;
  title: string;
  content: string;
  videoUrl: string;
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
  modules: [ModuleForm, ModuleForm, ModuleForm];
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  city: string;
  xp: number;
  totalXp: number;
  streak: number;
  plan: 'free' | 'pro' | 'max';
  role: string;
  createdAt: string;
}

interface Metrics {
  totalChapters: number;
  publishedChapters: number;
  draftChapters: number;
  totalUsers: number;
  quizzesCompleted: number;
  finalExamsCompleted: number;
  totalXpDistributed: number;
  totalXlmDistributed: number;
}

const MODULE_TAGS = ['blockchain', 'stellar', 'defi', 'nft', 'wallets', 'trading', 'web3'];
const emptyQuestion = (): QuestionFormItem => ({ question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' });
const emptyModule = (title: string): ModuleForm => ({ title, content: '', videoUrl: '', questions: Array(5).fill(null).map(() => emptyQuestion()) });
const emptyForm: ChapterForm = {
  title: '', description: '', moduleTag: '', order: 0, published: false,
  releaseWeek: '', estimatedMinutes: 15, xpReward: 140,
  modules: [emptyModule('Modulo 1'), emptyModule('Modulo 2'), emptyModule('Modulo 3')],
};

type AdminTab = 'chapters' | 'users' | 'metrics';

/*  Component  */

export function AdminDashboard() {
  //  Tab state 
  const [activeTab, setActiveTab] = useState<AdminTab>('chapters');

  //  Chapters state 
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChapterForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [expandedModule, setExpandedModule] = useState<number>(0);
  const [moduleTab, setModuleTab] = useState<Record<number, 'info' | 'video' | 'quiz'>>({ 0: 'info', 1: 'info', 2: 'info' });
  const [previewChapter, setPreviewChapter] = useState<Chapter | null>(null);
  const [reordering, setReordering] = useState(false);

  //  Users state 
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);

  //  Metrics state 
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  //  Load chapters 
  const loadChapters = async () => {
    try {
      const data = await apiService.adminGetChapters();
      setChapters(data);
    } catch { setError('No se pudo cargar los capitulos.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadChapters(); }, []);

  //  Load users 
  const loadUsers = async (page = 1, search = '') => {
    setUsersLoading(true);
    try {
      const data = await apiService.adminGetUsers(page, 50, search);
      setUsers(data.users);
      setUsersTotal(data.total);
    } catch { setError('No se pudo cargar usuarios.'); }
    finally { setUsersLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'users') loadUsers(userPage, userSearch);
  }, [activeTab, userPage]);

  //  Load metrics 
  const loadMetrics = async () => {
    setMetricsLoading(true);
    try {
      const data = await apiService.adminGetMetrics();
      setMetrics(data);
    } catch { setError('No se pudo cargar metricas.'); }
    finally { setMetricsLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'metrics') loadMetrics();
  }, [activeTab]);

  //  Reorder helpers 
  const moveChapter = async (index: number, direction: 'up' | 'down') => {
    const newChapters = [...chapters];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newChapters.length) return;
    [newChapters[index], newChapters[swapIndex]] = [newChapters[swapIndex], newChapters[index]];
    const reordered = newChapters.map((ch, i) => ({ ...ch, order: i + 1 }));
    setChapters(reordered);
    setReordering(true);
    try {
      await apiService.adminReorderChapters(reordered.map(ch => ({ id: ch.id, order: ch.order })));
    } catch { setError('Error al reordenar.'); loadChapters(); }
    finally { setReordering(false); }
  };

  //  Chapter form helpers 
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setExpandedModule(0);
    setModuleTab({ 0: 'info', 1: 'info', 2: 'info' });
    setShowForm(true);
  };

  const openEdit = async (ch: Chapter) => {
    setEditingId(ch.id);
    const full = await apiService.getChapter(ch.id);
    const lessonMods = (full.modules || []).filter((m: any) => m.type === 'lesson').sort((a: any, b: any) => a.order - b.order);
    const modules: [ModuleForm, ModuleForm, ModuleForm] = [
      emptyModule('Modulo 1'), emptyModule('Modulo 2'), emptyModule('Modulo 3'),
    ];
    for (let i = 0; i < Math.min(lessonMods.length, 3); i++) {
      const m = lessonMods[i];
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
      } catch { /* keep defaults */ }
      modules[i] = { id: m.id, title: m.title || `Modulo ${i + 1}`, content: m.content || '', videoUrl: m.videoUrl || '', questions: qs };
    }
    setForm({
      title: ch.title, description: ch.description || '', moduleTag: ch.moduleTag || '',
      order: ch.order, published: ch.published, releaseWeek: (ch as any).releaseWeek || '',
      estimatedMinutes: ch.estimatedMinutes || 15, xpReward: ch.xpReward || 140, modules,
    });
    setExpandedModule(0);
    setModuleTab({ 0: 'info', 1: 'info', 2: 'info' });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); setError(''); };

  const updateModule = (index: number, field: keyof ModuleForm, value: any) => {
    setForm(f => {
      const mods = [...f.modules] as [ModuleForm, ModuleForm, ModuleForm];
      mods[index] = { ...mods[index], [field]: value };
      return { ...f, modules: mods };
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('El titulo es requerido.'); return; }
    for (let i = 0; i < 3; i++) {
      const mod = form.modules[i];
      const filled = mod.questions.filter(q => q.question.trim());
      if (filled.length < 5) {
        setError(`Modulo ${i + 1}: se requieren al menos 5 preguntas.`);
        setExpandedModule(i); setModuleTab(p => ({ ...p, [i]: 'quiz' })); return;
      }
      for (const q of filled) {
        if (q.options.some(o => !o.trim())) {
          setError(`Modulo ${i + 1}: todas las opciones deben estar llenas.`);
          setExpandedModule(i); setModuleTab(p => ({ ...p, [i]: 'quiz' })); return;
        }
      }
    }
    setSaving(true); setError('');
    try {
      if (editingId) {
        await apiService.adminUpdateChapter(editingId, {
          title: form.title, description: form.description, moduleTag: form.moduleTag,
          order: form.order, published: form.published, releaseWeek: form.releaseWeek || undefined,
          estimatedMinutes: form.estimatedMinutes, xpReward: form.xpReward,
        });
        for (const mod of form.modules) {
          if (mod.id) {
            await apiService.adminUpdateModule(mod.id, { title: mod.title, content: mod.content || undefined, videoUrl: mod.videoUrl || undefined });
            await apiService.adminReplaceModuleQuestions(mod.id, mod.questions);
          }
        }
      } else {
        const created = await apiService.adminCreateChapter({
          title: form.title, description: form.description, moduleTag: form.moduleTag,
          order: form.order, published: form.published, releaseWeek: form.releaseWeek || undefined,
          estimatedMinutes: form.estimatedMinutes, xpReward: form.xpReward,
        });
        const lessonMods = (created.modules || []).filter((m: any) => m.type === 'lesson').sort((a: any, b: any) => a.order - b.order);
        for (let i = 0; i < Math.min(lessonMods.length, 3); i++) {
          const mod = form.modules[i];
          await apiService.adminUpdateModule(lessonMods[i].id, { title: mod.title, content: mod.content || undefined, videoUrl: mod.videoUrl || undefined });
          await apiService.adminReplaceModuleQuestions(lessonMods[i].id, mod.questions);
        }
      }
      await loadChapters(); closeForm();
    } catch { setError('Error al guardar.'); }
    finally { setSaving(false); }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await apiService.adminTogglePublish(id);
      setChapters(prev => prev.map(c => c.id === id ? { ...c, published: !c.published } : c));
    } catch { setError('Error al cambiar estado.'); }
  };

  const handleDelete = async (id: string) => {
    try { await apiService.adminDeleteChapter(id); setChapters(prev => prev.filter(c => c.id !== id)); setDeleteConfirm(null); }
    catch { setError('Error al eliminar.'); }
  };

  const handleReleaseThisWeek = async (id: string) => {
    try {
      await apiService.adminReleaseThisWeek(id);
      await loadChapters();
    } catch { setError('Error al liberar.'); }
  };

  const published = chapters.filter(c => c.published).length;
  const drafts = chapters.filter(c => !c.published).length;

  //  Render 
  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Panel de Administracion</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestiona capitulos, usuarios y metricas de la plataforma</p>
          </div>
          {activeTab === 'chapters' && (
            <button className="btn btn-primary" onClick={openCreate}><span style={{marginRight:4}}>+</span> Nuevo capitulo</button>
          )}
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {([
            { key: 'chapters', label: 'Capitulos', icon: '' },
            { key: 'users',    label: 'Usuarios',  icon: '' },
            { key: 'metrics',  label: 'Metricas',  icon: '' },
          ] as { key: AdminTab; label: string; icon: string }[]).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: '10px 18px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
              background: 'none', border: 'none', borderBottom: activeTab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === t.key ? 'var(--primary)' : 'var(--text-muted)', marginBottom: -1,
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 8, padding: '12px 16px', color: 'var(--danger)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
             {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}></button>
          </div>
        )}

        {/*  CHAPTERS TAB  */}
        {activeTab === 'chapters' && (
          <>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Total', value: chapters.length, color: 'var(--text)' },
                { label: 'Publicados', value: published, color: 'var(--success)' },
                { label: 'Borradores', value: drafts, color: 'var(--text-muted)' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>Cargando...</div>
            ) : chapters.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}></div>
                <p style={{ color: 'var(--text-muted)' }}>No hay capitulos. Crea el primero.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chapters.map((ch, idx) => (
                  <motion.div key={ch.id} layout className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
                    {/* Reorder arrows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '2px 4px' }} disabled={idx === 0 || reordering} onClick={() => moveChapter(idx, 'up')} title="Subir"></button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '2px 4px' }} disabled={idx === chapters.length - 1 || reordering} onClick={() => moveChapter(idx, 'down')} title="Bajar"></button>
                    </div>
                    {/* Order badge */}
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>{ch.order}</div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.title}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                        {ch.moduleTag && <span className="badge badge-blue">{ch.moduleTag}</span>}
                        {(ch as any).releaseWeek && (
                          <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.68rem' }}>
                            Semana: {(ch as any).releaseWeek}
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{ch.estimatedMinutes} min  {ch.xpReward} XP</span>
                      </div>
                    </div>
                    {/* Status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: ch.published ? 'rgba(63,185,80,0.1)' : 'rgba(125,133,144,0.1)', border: `1px solid ${ch.published ? 'rgba(63,185,80,0.25)' : 'rgba(125,133,144,0.2)'}`, borderRadius: 5, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600, color: ch.published ? 'var(--success)' : 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {ch.published ? ' Publicado' : ' Borrador'}
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setPreviewChapter(ch)} title="Vista previa"></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleReleaseThisWeek(ch.id)} title="Liberar esta semana"></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleTogglePublish(ch.id)} title={ch.published ? 'Despublicar' : 'Publicar'}>{ch.published ? '' : ''}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(ch)} title="Editar"></button>
                      {deleteConfirm === ch.id ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ch.id)}>Confirmar</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}></button>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(ch.id)} title="Eliminar"></button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/*  USERS TAB  */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <input
                className="input-field"
                placeholder="Buscar por nombre, email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setUserPage(1); loadUsers(1, userSearch); } }}
                style={{ flex: 1, minWidth: 200 }}
              />
              <button className="btn btn-primary" onClick={() => { setUserPage(1); loadUsers(1, userSearch); }}>Buscar</button>
            </div>
            {usersLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>Cargando usuarios...</div>
            ) : (
              <>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{usersTotal} usuarios en total</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Usuario', 'Email', 'Ciudad', 'XP Total', 'Racha', 'Plan', 'Rol', 'Registro'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{u.displayName}<div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>@{u.username}</div></td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.email}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.city || ''}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--primary)' }}>{u.totalXp.toLocaleString()}</td>
                          <td style={{ padding: '10px 12px' }}>{u.streak > 0 ? ` ${u.streak}` : ''}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700,
                              background: u.plan === 'max' ? 'rgba(139,92,246,0.15)' : u.plan === 'pro' ? 'rgba(59,130,246,0.15)' : 'rgba(125,133,144,0.1)',
                              color: u.plan === 'max' ? '#8b5cf6' : u.plan === 'pro' ? '#3b82f6' : 'var(--text-muted)',
                            }}>{u.plan.toUpperCase()}</span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, background: u.role === 'admin' ? 'rgba(248,81,73,0.1)' : 'rgba(63,185,80,0.1)', color: u.role === 'admin' ? 'var(--danger)' : 'var(--success)' }}>{u.role}</span>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(u.createdAt).toLocaleDateString('es-MX')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {usersTotal > 50 && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
                    <button className="btn btn-ghost btn-sm" disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)}> Anterior</button>
                    <span style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pag. {userPage} / {Math.ceil(usersTotal / 50)}</span>
                    <button className="btn btn-ghost btn-sm" disabled={userPage >= Math.ceil(usersTotal / 50)} onClick={() => setUserPage(p => p + 1)}>Siguiente </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/*  METRICS TAB  */}
        {activeTab === 'metrics' && (
          <div>
            {metricsLoading || !metrics ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>Cargando metricas...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                  {[
                    { label: 'Total usuarios', value: metrics.totalUsers.toLocaleString(), icon: '', color: '#3b82f6' },
                    { label: 'Capitulos publicados', value: `${metrics.publishedChapters} / ${metrics.totalChapters}`, icon: '', color: 'var(--success)' },
                    { label: 'Quizzes completados', value: metrics.quizzesCompleted.toLocaleString(), icon: '', color: '#8b5cf6' },
                    { label: 'Examenes finales', value: metrics.finalExamsCompleted.toLocaleString(), icon: '', color: '#f59e0b' },
                    { label: 'XP distribuido', value: metrics.totalXpDistributed.toLocaleString(), icon: '', color: 'var(--primary)' },
                    { label: 'XLM distribuido', value: `${metrics.totalXlmDistributed.toLocaleString()} XLM`, icon: '', color: '#06b6d4' },
                  ].map((m, i) => (
                    <div key={i} className="card" style={{ padding: '20px 24px' }}>
                      <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{m.icon}</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost btn-sm" onClick={loadMetrics}> Actualizar</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/*  PREVIEW MODAL  */}
      {previewChapter && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setPreviewChapter(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: 12, width: '100%', maxWidth: 560, padding: 28 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Vista previa del capitulo</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreviewChapter(null)}></button>
            </div>
            {previewChapter.moduleTag && <span className="badge badge-blue" style={{ marginBottom: 12, display: 'inline-block' }}>{previewChapter.moduleTag}</span>}
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>{previewChapter.title}</h3>
            {previewChapter.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>{previewChapter.description}</p>}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}> {previewChapter.estimatedMinutes} min</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--primary)' }}> {previewChapter.xpReward} XP</span>
              {(previewChapter as any).releaseWeek && <span style={{ fontSize: '0.82rem', color: '#f59e0b' }}> Semana {(previewChapter as any).releaseWeek}</span>}
              <span style={{ fontSize: '0.82rem', color: previewChapter.published ? 'var(--success)' : 'var(--text-muted)' }}>{previewChapter.published ? ' Publicado' : ' Borrador'}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>MODULOS</div>
              {[1, 2, 3].map(n => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>{n}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Modulo {n}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}> Lectura   Video   Quiz (5 preguntas)</div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f59e0b', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>4</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Examen Final </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>20 preguntas  80% para aprobar  NFT al completar</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setPreviewChapter(null)}>Cerrar</button>
              <button className="btn btn-primary" onClick={() => { openEdit(previewChapter); setPreviewChapter(null); }}> Editar</button>
            </div>
          </motion.div>
        </div>
      )}

      {/*  CHAPTER FORM MODAL  */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: 12, width: '100%', maxWidth: 900, padding: 28, marginTop: 20, marginBottom: 40 }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingId ? 'Editar capitulo' : 'Nuevo capitulo'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={closeForm}></button>
            </div>

            {error && (
              <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 7, padding: '10px 14px', color: 'var(--danger)', marginBottom: 18, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 7 }}>
                 {error}
              </div>
            )}

            {/* Chapter metadata */}
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: 20, marginBottom: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)' }}>DATOS DEL CAPITULO</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Titulo *</label>
                  <input className="input-field" placeholder="Ej. Introduccion al Blockchain" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripcion</label>
                  <input className="input-field" placeholder="Breve descripcion del capitulo" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Semana de liberacion (Free)</label>
                    <input className="input-field" placeholder="Ej. 2026-W12" value={form.releaseWeek} onChange={e => setForm(f => ({ ...f, releaseWeek: e.target.value }))} />
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: 2 }}>Formato: YYYY-Wnn</p>
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={() => {
                      const now = new Date();
                      const jan1 = new Date(now.getFullYear(), 0, 1);
                      const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
                      const wk = Math.ceil((days + jan1.getDay() + 1) / 7);
                      setForm(f => ({ ...f, releaseWeek: `${now.getFullYear()}-W${String(wk).padStart(2, '0')}` }));
                    }}> Liberar esta semana</button>
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

            {/* 3 Lesson Modules */}
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)' }}>MODULOS (Lectura + Video + Quiz)</h3>
            {form.modules.map((mod, i) => {
              const isExpanded = expandedModule === i;
              const tab = moduleTab[i] || 'info';
              return (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
                  <button onClick={() => setExpandedModule(isExpanded ? -1 : i)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: isExpanded ? 'var(--bg-subtle)' : 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', textAlign: 'left' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{mod.title || `Modulo ${i + 1}`}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {mod.content ? ' Lectura' : ' Lectura'}  {mod.videoUrl ? ' Video' : ' Video'}  {mod.questions.some(q => q.question) ? ' Quiz' : ' Quiz'}
                      </div>
                    </div>
                    {isExpanded ? '' : ''}
                  </button>

                  {isExpanded && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <div className="form-group" style={{ marginBottom: 12 }}>
                        <label className="form-label">Titulo del modulo</label>
                        <input className="input-field" placeholder={`Ej. Que es Blockchain?`} value={mod.title} onChange={e => updateModule(i, 'title', e.target.value)} />
                      </div>
                      {/* Section tabs */}
                      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                        {([
                          { key: 'info' as const, label: ' Lectura', color: '#3b82f6' },
                          { key: 'video' as const, label: ' Video', color: '#8b5cf6' },
                          { key: 'quiz' as const, label: ' Quiz', color: '#f59e0b' },
                        ]).map(t => (
                          <button key={t.key} onClick={() => setModuleTab(p => ({ ...p, [i]: t.key }))}
                            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', background: tab === t.key ? `${t.color}20` : 'var(--bg-subtle)', color: tab === t.key ? t.color : 'var(--text-muted)', border: tab === t.key ? `2px solid ${t.color}40` : '1px solid var(--border)' }}>
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {tab === 'info' && (
                        <div>
                          <label className="form-label">Contenido de lectura</label>
                          <textarea className="input-field" placeholder="Escribe el contenido del modulo..." value={mod.content} onChange={e => updateModule(i, 'content', e.target.value)}
                            style={{ minHeight: 220, resize: 'vertical', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', lineHeight: 1.7 }} />
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: 4 }}>Usa doble salto de linea para separar parrafos. Usa  para listas.</p>
                        </div>
                      )}

                      {tab === 'video' && (
                        <div>
                          <label className="form-label">URL del video</label>
                          <input className="input-field" placeholder="https://..." value={mod.videoUrl} onChange={e => updateModule(i, 'videoUrl', e.target.value)} />
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: 4 }}>El usuario debe ver el 90% para completar esta seccion.</p>
                        </div>
                      )}

                      {tab === 'quiz' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <label style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-muted)' }}>PREGUNTAS ({mod.questions.length} / min 5)</label>
                            <button type="button" onClick={() => updateModule(i, 'questions', [...mod.questions, emptyQuestion()])}
                              style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623', borderRadius: 8, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                              + Agregar pregunta
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {mod.questions.map((q, qi) => (
                              <div key={qi} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pregunta {qi + 1}</span>
                                  {mod.questions.length > 1 && (
                                    <button type="button" onClick={() => updateModule(i, 'questions', mod.questions.filter((_, idx) => idx !== qi))}
                                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem' }}> Eliminar</button>
                                  )}
                                </div>
                                <input className="input-field" placeholder="Cual es...?" value={q.question}
                                  onChange={e => { const u = [...mod.questions]; u[qi] = { ...u[qi], question: e.target.value }; updateModule(i, 'questions', u); }}
                                  style={{ marginBottom: 10 }} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                                  {q.options.map((opt, oi) => (
                                    <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <input type="radio" name={`correct-${i}-${qi}`} checked={q.correctIndex === oi}
                                        onChange={() => { const u = [...mod.questions]; u[qi] = { ...u[qi], correctIndex: oi }; updateModule(i, 'questions', u); }}
                                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#00D4AA', flexShrink: 0 }} title="Marcar como correcta" />
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: 16, flexShrink: 0 }}>{String.fromCharCode(65 + oi)}</span>
                                      <input className="input-field" placeholder={`Opcion ${String.fromCharCode(65 + oi)}`} value={opt}
                                        onChange={e => { const u = [...mod.questions]; const opts = [...u[qi].options] as [string,string,string,string]; opts[oi] = e.target.value; u[qi] = { ...u[qi], options: opts }; updateModule(i, 'questions', u); }}
                                        style={{ flex: 1, border: q.correctIndex === oi ? '1.5px solid #00D4AA' : '1px solid var(--border)' }} />
                                    </div>
                                  ))}
                                  <p style={{ fontSize: '0.7rem', color: '#00D4AA', margin: 0 }}>Radio = Respuesta correcta</p>
                                </div>
                                <input className="input-field" placeholder="Explicacion (se muestra al terminar el quiz)" value={q.explanation}
                                  onChange={e => { const u = [...mod.questions]; u[qi] = { ...u[qi], explanation: e.target.value }; updateModule(i, 'questions', u); }} />
                              </div>
                            ))}
                          </div>
                          {mod.questions.length < 5 && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 8 }}>Se requieren al menos 5 preguntas</p>}
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
                <span style={{ fontSize: '1.2rem' }}></span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f59e0b' }}>Modulo 4  Examen Final</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Se genera automaticamente con preguntas mezcladas de los 3 modulos anteriores.</p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={closeForm}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : (editingId ? ' Guardar cambios' : ' Crear capitulo')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
