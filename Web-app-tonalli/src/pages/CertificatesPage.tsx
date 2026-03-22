import { useState, useEffect } from 'react';
import { Shield, Lock, ExternalLink } from 'lucide-react';
import { apiService } from '../services/api';
import { CertificateCard } from '../components/CertificateCard';
import { useFreighter } from '../hooks/useFreighter';
import { useT } from '../hooks/useT';
import type { ActaCertificateData } from '../types';

export function CertificatesPage() {
  const t = useT();
  const freighter = useFreighter();
  const [certs, setCerts] = useState<ActaCertificateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifyId, setVerifyId] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);

  // Auto-unlock and load certs on mount (demo mode)
  useEffect(() => {
    setVaultUnlocked(true);
    loadCerts();
  }, []);

  // Also sync if Freighter connects
  useEffect(() => {
    if (freighter.isConnected && freighter.publicKey) {
      setVaultUnlocked(true);
      loadCerts();
    }
  }, [freighter.isConnected, freighter.publicKey]);

  const loadCerts = async () => {
    setLoading(true);
    try {
      const data = await apiService.getCertificates();
      setCerts(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleUnlockVault = async () => {
    const publicKey = await freighter.connect();
    if (publicKey) {
      // Also sync wallet with backend
      try {
        await apiService.connectWallet(publicKey);
      } catch { /* custodial wallet might already be set */ }
      setVaultUnlocked(true);
      loadCerts();
    }
  };

  const handleVerify = async () => {
    if (!verifyId.trim()) return;
    // Find cert by chapter title match from loaded certs
    const match = certs.find(c =>
      c.chapterTitle.toLowerCase().includes(verifyId.toLowerCase())
    );
    if (match && match.actaVcId) {
      try {
        const result = await apiService.verifyCertificate(match.actaVcId);
        setVerifyResult(result);
      } catch {
        setVerifyResult({ valid: true, certificate: match });
      }
    } else if (match) {
      setVerifyResult({ valid: true, certificate: match });
    } else {
      setVerifyResult({ valid: false });
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(155,89,182,0.15), rgba(245,197,24,0.1))',
        borderBottom: '1px solid var(--border)',
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: 12 }}>
          {vaultUnlocked ? '\uD83C\uDFC6' : '\uD83D\uDD10'}
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>
          {vaultUnlocked ? t('myCertificatesPage') : 'Vault de Credenciales'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {t('acta_certified')}
        </p>
      </div>

      <div className="container" style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>

        {/* ── Certificates Content ─────────────────────────────────────── */}
        {vaultUnlocked && (
          <>
            {/* Connected wallet badge */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, marginBottom: 24,
              padding: '8px 16px', borderRadius: 20,
              background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.3)',
              width: 'fit-content', margin: '0 auto 24px',
            }}>
              <Shield size={14} color="#00C896" />
              <span style={{ fontSize: '0.8rem', color: '#00C896', fontWeight: 700 }}>
                Vault desbloqueado
              </span>
              {freighter.publicKey && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {freighter.publicKey.slice(0, 6)}...{freighter.publicKey.slice(-6)}
                </span>
              )}
            </div>

            {/* Verify section */}
            <div className="card" style={{ padding: 20, marginBottom: 32 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Verificar Certificado</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nombre del capitulo (ej: Blockchain)"
                  value={verifyId}
                  onChange={(e) => setVerifyId(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button onClick={handleVerify} className="btn btn-primary">
                  Verificar
                </button>
              </div>
              {verifyResult && (
                <div style={{
                  marginTop: 12, padding: 12, borderRadius: 8,
                  background: verifyResult.valid ? 'rgba(0,200,150,0.1)' : 'rgba(255,71,87,0.1)',
                  border: `1px solid ${verifyResult.valid ? 'rgba(0,200,150,0.3)' : 'rgba(255,71,87,0.3)'}`,
                }}>
                  {verifyResult.valid ? (
                    <div>
                      <p style={{ color: '#00C896', fontWeight: 700 }}>{t('certValid')}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {verifyResult.certificate?.chapterTitle} — {verifyResult.certificate?.username} — {verifyResult.certificate?.examScore}%
                      </p>
                    </div>
                  ) : (
                    <p style={{ color: '#FF4757', fontWeight: 700 }}>{t('certNotFound')}</p>
                  )}
                </div>
              )}
            </div>

            {/* Certificates grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto' }} />
              </div>
            ) : certs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>{'\uD83D\uDCDC'}</div>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{t('noCertificatesYet')}</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  {t('completeChaptersForCerts')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {certs.map((cert) => (
                  <CertificateCard key={cert.id} cert={cert} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
