import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActaCertificate } from './entities/acta-certificate.entity';
import { User } from '../users/entities/user.entity';
import { ActaService } from '../acta/acta.service';
import { PostHogService } from '../posthog/posthog.service';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    @InjectRepository(ActaCertificate)
    private readonly certRepo: Repository<ActaCertificate>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly actaService: ActaService,
    private readonly postHogService: PostHogService,
  ) {}

  // Issue a real ACTA verifiable credential and store in DB
  async issueActaCertificate(data: {
    userId: string;
    chapterId: string;
    chapterTitle: string;
    examScore: number;
  }) {
    const { txId, vcId } = await this.actaService.issueCredential(
      data.userId,
      data.chapterId,
      data.chapterTitle,
      data.examScore,
    );

    const cert = this.certRepo.create({
      userId: data.userId,
      chapterId: data.chapterId,
      chapterTitle: data.chapterTitle,
      actaVcId: vcId,
      txHash: txId,
      examScore: data.examScore,
      type: 'official',
      status: 'issued',
    });

    const saved = await this.certRepo.save(cert);
    this.logger.log(
      `[ACTA] Certificate issued: vcId=${vcId}, txId=${txId}, user=${data.userId}`,
    );

    // Track certificate_issued
    this.postHogService.capture('certificate_issued', {
      user_id: data.userId,
      chapter_id: data.chapterId,
      chapter_title: data.chapterTitle,
      exam_score: data.examScore,
      vc_id: vcId,
      tx_hash: txId
    }, data.userId);

    return {
      id: saved.id,
      chapterId: saved.chapterId,
      chapterTitle: saved.chapterTitle,
      actaVcId: saved.actaVcId,
      txHash: saved.txHash,
      examScore: saved.examScore,
      status: saved.status,
      type: saved.type,
      issuedAt: saved.issuedAt,
      stellarExplorerUrl: saved.txHash
        ? `https://stellar.expert/explorer/testnet/tx/${saved.txHash}`
        : null,
    };
  }

  // Called after ACTA frontend issues the VC — stores metadata in DB (legacy)
  async storeCertificate(data: {
    userId: string;
    chapterId: string;
    chapterTitle: string;
    actaVcId: string;
    txHash: string;
    examScore: number;
    type: 'official' | 'achievement';
  }) {
    const cert = this.certRepo.create({
      ...data,
      status: 'issued',
    });
    return this.certRepo.save(cert);
  }

  // Get all certificates for a user
  async getUserCertificates(userId: string) {
    const certs = await this.certRepo.find({
      where: { userId },
      order: { issuedAt: 'DESC' },
    });

    return certs.map((c) => ({
      id: c.id,
      chapterId: c.chapterId,
      chapterTitle: c.chapterTitle,
      actaVcId: c.actaVcId,
      txHash: c.txHash,
      examScore: c.examScore,
      status: c.status,
      type: c.type,
      issuedAt: c.issuedAt,
      stellarExplorerUrl: c.txHash
        ? `https://stellar.expert/explorer/testnet/tx/${c.txHash}`
        : null,
    }));
  }

  // Verify a certificate exists (DB + on-chain)
  async verifyCertificate(actaVcId: string) {
    const cert = await this.certRepo.findOne({
      where: { actaVcId },
      relations: ['user'],
    });

    if (!cert) throw new NotFoundException('Certificate not found');

    // Also verify on-chain via ACTA
    let onChainStatus: { status: string; since?: string } = { status: 'unknown' };
    try {
      onChainStatus = await this.actaService.verifyCredential(actaVcId);
    } catch {
      // Graceful fallback
    }

    return {
      valid: cert.status === 'issued',
      onChainStatus: onChainStatus.status,
      certificate: {
        id: cert.id,
        chapterTitle: cert.chapterTitle,
        username: cert.user?.username,
        examScore: cert.examScore,
        issuedAt: cert.issuedAt,
        txHash: cert.txHash,
        stellarExplorerUrl: cert.txHash
          ? `https://stellar.expert/explorer/testnet/tx/${cert.txHash}`
          : null,
      },
    };
  }
}
