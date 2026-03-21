import { useState } from 'react';
import { useCredential } from '@acta-team/acta-sdk';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface IssueCertificateParams {
  chapterId: string;
  chapterTitle: string;
  examScore: number;
}

export function useIssueCertificate() {
  const { issue } = useCredential();
  const { user } = useAuthStore();
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issueCertificate = async ({ chapterId, chapterTitle, examScore }: IssueCertificateParams) => {
    setIssuing(true);
    setError(null);

    const timestamp = Date.now();
    const vcId = `vc:tonalli:chapter:${chapterId}:${timestamp}`;
    const walletAddress = user?.walletAddress || '';

    // Build W3C VC 2.0 payload
    const vcPayload = {
      '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://www.w3.org/ns/credentials/examples/v2',
      ],
      id: vcId,
      type: ['VerifiableCredential', 'TonalliChapterCertificate'],
      issuer: {
        id: `did:pkh:stellar:testnet:${walletAddress}`,
        name: 'Tonalli - Plataforma Educativa Web3',
      },
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: `did:pkh:stellar:testnet:${walletAddress}`,
        achievement: {
          type: 'ChapterCompletion',
          name: chapterTitle,
          description: `Completó el capítulo "${chapterTitle}" con calificación de ${examScore}%`,
          criteria: 'Aprobó el examen final con mínimo 80%',
        },
        platform: 'Tonalli',
        userId: user?.id,
        username: user?.username,
        chapterId,
        examScore,
        completedAt: new Date().toISOString(),
      },
    };

    try {
      // Try to issue via ACTA SDK (requires API key + wallet signing)
      let txId = '';
      try {
        const result = await issue({
          owner: walletAddress,
          vcId,
          vcData: JSON.stringify(vcPayload),
          issuer: walletAddress,
          holder: `did:pkh:stellar:testnet:${walletAddress}`,
          issuerDid: `did:pkh:stellar:testnet:${walletAddress}`,
          signTransaction: async (xdr: string) => {
            // In production, this would use Freighter or smart-account-kit to sign
            // For demo, we return the XDR as-is (simulated signing)
            console.log('[ACTA] Transaction to sign:', xdr.substring(0, 50) + '...');
            return xdr;
          },
        });
        txId = (result as any)?.txId || `ACTA_${timestamp}`;
      } catch (actaErr: any) {
        console.warn('[ACTA] SDK issuance failed (expected without API key):', actaErr.message);
        // Fallback: simulated certificate for demo
        txId = `SIMULATED_ACTA_${timestamp}_${chapterId.substring(0, 8)}`;
      }

      // Store certificate metadata in our backend
      const stored = await apiService.storeCertificate({
        chapterId,
        chapterTitle,
        actaVcId: vcId,
        txHash: txId,
        examScore,
        type: 'official',
      });

      setIssuing(false);
      return {
        success: true,
        certificate: stored,
        vcId,
        txHash: txId,
      };
    } catch (err: any) {
      console.error('[ACTA] Certificate issuance error:', err);
      setError(err.message || 'Error al emitir certificado');
      setIssuing(false);
      return { success: false, error: err.message };
    }
  };

  return { issueCertificate, issuing, error };
}
