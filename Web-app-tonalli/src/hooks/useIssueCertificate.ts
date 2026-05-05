import { useState } from 'react';
import { apiService } from '../services/api';
import posthog from 'posthog-js';

interface IssueCertificateParams {
  chapterId: string;
  chapterTitle: string;
  examScore: number;
}

// Certificate issuance via backend ACTA integration.
// Backend handles vault, signing, and on-chain credential issuance.
export function useIssueCertificate() {
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issueCertificate = async ({ chapterId, chapterTitle, examScore }: IssueCertificateParams) => {
    setIssuing(true);
    setError(null);

    try {
      const result = await apiService.issueCertificate({
        chapterId,
        chapterTitle,
        examScore,
      });

      // Track certificate_issued
      posthog.capture('certificate_issued', {
        chapter_id: chapterId,
        chapter_title: chapterTitle,
        exam_score: examScore,
        vc_id: result.actaVcId,
        tx_hash: result.txHash
      });

      setIssuing(false);
      return {
        success: true,
        certificate: result,
        vcId: result.actaVcId,
        txHash: result.txHash,
      };
    } catch (err: any) {
      console.error('[Certificate] Issuance error:', err);
      setError(err?.response?.data?.message || err.message || 'Error al emitir certificado');
      setIssuing(false);
      return { success: false, error: err.message };
    }
  };

  return { issueCertificate, issuing, error };
}
