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
    try {
      const result = await apiService.verifyCertificate(verifyId.trim());
      setVerifyResult(result);
    } catch {
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
                  placeholder="Ingresa el VC ID (ej: vc:tonalli:ch:...)"
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
                  marginTop: 12, padding: 16, borderRadius: 12,
                  background: verifyResult.valid ? 'rgba(0,200,150,0.08)' : 'rgba(255,71,87,0.1)',
                  border: `1px solid ${verifyResult.valid ? 'rgba(0,200,150,0.3)' : 'rgba(255,71,87,0.3)'}`,
                }}>
                  {verifyResult.valid ? (
                    <div>
                      <p style={{ color: '#00D4AA', fontWeight: 800, fontSize: '1rem', marginBottom: 12 }}>
                        {'\u2713'} Certificado verificado on-chain
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Capitulo:</span>
                          <span style={{ fontWeight: 700 }}>{verifyResult.certificate?.chapterTitle}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Calificacion:</span>
                          <span style={{ fontWeight: 700, color: '#00D4AA' }}>{verifyResult.certificate?.examScore}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
                          <span style={{ fontWeight: 700, color: '#00D4AA' }}>{'\u2713'} Emitido</span>
                        </div>
                        {verifyResult.certificate?.actaVcId && (
                          <div style={{ marginTop: 4 }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ACTA VC ID: </span>
                            <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#E91E8C' }}>{verifyResult.certificate.actaVcId}</span>
                          </div>
                        )}
                        {verifyResult.certificate?.txHash && (
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Stellar TX: </span>
                            <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#F5A623' }}>{verifyResult.certificate.txHash.substring(0, 20)}...</span>
                            {verifyResult.certificate.stellarExplorerUrl && (
                              <a href={verifyResult.certificate.stellarExplorerUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, fontSize: '0.72rem', color: '#00D4AA', textDecoration: 'underline' }}>
                                Ver en Stellar Explorer
                              </a>
                            )}
                          </div>
                        )}
                        {verifyResult.certificate?.issuedAt && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Emitido: {new Date(verifyResult.certificate.issuedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#FF4757', fontWeight: 700 }}>Certificado no encontrado</p>
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
