import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeeklyScore } from './entities/weekly-score.entity';
import { PodiumReward } from './entities/podium-reward.entity';
import { User } from '../users/entities/user.entity';
import { StellarService } from '../stellar/stellar.service';
import { SorobanService } from '../stellar/soroban.service';

@Injectable()
export class PodiumService {
  private readonly logger = new Logger(PodiumService.name);
  private paused = false; // Circuit breaker

  constructor(
    @InjectRepository(WeeklyScore)
    private readonly scoresRepo: Repository<WeeklyScore>,
    @InjectRepository(PodiumReward)
    private readonly rewardsRepo: Repository<PodiumReward>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly stellarService: StellarService,
    private readonly sorobanService: SorobanService,
  ) {}

  getCurrentWeek(): string {
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
    const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  // Update a user's weekly score (called when they complete activities)
  async updateScore(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (user?.plan === 'free') return; // Only Pro/Max users participate

    const week = this.getCurrentWeek();
    let score = await this.scoresRepo.findOne({ where: { userId, week } });

    if (!score) {
      score = this.scoresRepo.create({ userId, week });
    }

    // Recalculate score based on current state
    score.activeDays = Math.min(7, (score.activeDays || 0) + 1);

    // Scoring formula:
    // chapters * 100 + avgScore + activeDays * 10
    score.totalScore =
      score.chaptersCompleted * 100 +
      score.avgExamScore +
      score.activeDays * 10;

    await this.scoresRepo.save(score);
  }

  async recordChapterCompletion(userId: string, examScore: number) {
    const week = this.getCurrentWeek();
    let score = await this.scoresRepo.findOne({ where: { userId, week } });

    if (!score) {
      score = this.scoresRepo.create({ userId, week, activeDays: 1 });
    }

    score.chaptersCompleted += 1;
    // Running average of exam scores
    const totalScores = score.chaptersCompleted;
    score.avgExamScore = Math.round(
      ((score.avgExamScore * (totalScores - 1)) + examScore) / totalScores,
    );
    score.totalScore =
      score.chaptersCompleted * 100 +
      score.avgExamScore +
      score.activeDays * 10;

    await this.scoresRepo.save(score);
  }

  // Get current week's leaderboard
  async getWeeklyLeaderboard(userId: string) {
    // Plan gate disabled for demo
    // const user = await this.usersRepo.findOne({ where: { id: userId } });
    // if (user?.plan === 'free') {
    //   throw new ForbiddenException('El podio es exclusivo para usuarios Pro y Max');
    // }

    const week = this.getCurrentWeek();
    const scores = await this.scoresRepo.find({
      where: { week },
      order: { totalScore: 'DESC' },
      take: 50,
      relations: ['user'],
    });

    return {
      week,
      rewards: { first: 15, second: 10, third: 5 },
      rankings: scores.map((s, i) => ({
        rank: i + 1,
        userId: s.userId,
        username: s.user?.username || 'Unknown',
        displayName: s.user?.displayName || s.user?.username,
        city: s.user?.city || 'Ciudad de México',
        character: s.user?.character || 'chima',
        totalScore: s.totalScore,
        chaptersCompleted: s.chaptersCompleted,
        avgExamScore: s.avgExamScore,
        activeDays: s.activeDays,
        isCurrentUser: s.userId === userId,
      })),
    };
  }

  // Get all-time leaderboard (available to everyone, shows XP)
  async getGlobalLeaderboard() {
    const users = await this.usersRepo.find({
      order: { totalXp: 'DESC' },
      take: 50,
    });

    return users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      username: u.username,
      displayName: u.displayName || u.username,
      city: u.city || 'Ciudad de México',
      xp: u.totalXp,
      streak: u.currentStreak,
      character: u.character || 'chima',
      plan: u.plan || 'free',
    }));
  }

  // Get city-based leaderboard
  async getCityLeaderboard(city: string) {
    const users = await this.usersRepo.find({
      where: { city },
      order: { totalXp: 'DESC' },
      take: 50,
    });

    return users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      username: u.username,
      displayName: u.displayName || u.username,
      city: u.city,
      xp: u.totalXp,
      streak: u.currentStreak,
      character: u.character || 'chima',
    }));
  }

  // Get user's podium NFTs from the rewards table
  async getUserPodiumNfts(userId: string) {
    const rewards = await this.rewardsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return rewards
      .filter((r) => r.status === 'paid')
      .map((r) => ({
        id: r.id,
        week: r.week,
        position: r.position,
        rewardUsd: r.rewardUsd,
        rewardXlm: r.rewardXlm,
        txHash: r.txHash,
        nftTxHash: r.nftTxHash,
        createdAt: r.createdAt,
        stellarExplorerUrl: r.nftTxHash
          ? `https://stellar.expert/explorer/testnet/tx/${r.nftTxHash}`
          : null,
      }));
  }

  // Circuit breaker
  pauseRewards() {
    this.paused = true;
    this.logger.warn('⚠️ Podium rewards PAUSED (circuit breaker activated)');
  }

  resumeRewards() {
    this.paused = false;
    this.logger.log('✅ Podium rewards RESUMED');
  }

  // Cron: close weekly podium every Sunday at 23:59 CDMX (America/Mexico_City)
  @Cron('59 23 * * 0', { timeZone: 'America/Mexico_City' })
  async handleWeeklyPodiumClose() {
    this.logger.log('[Podium] Closing weekly podium - Sunday 23:59 CDMX');
    try {
      await this.distributeWeeklyRewards();
    } catch (e) {
      this.logger.error('[Podium] Weekly distribution error:', e.message);
    }
  }

  // Demo: simulate podium distribution with the current user as 1st place
  async demoDistributeRewards(currentUserId: string) {
    const week = this.getCurrentWeek();
    const user = await this.usersRepo.findOne({ where: { id: currentUserId } });
    if (!user) throw new ForbiddenException('User not found');

    // Create/update a weekly score for this user so they appear in the leaderboard
    let score = await this.scoresRepo.findOne({ where: { userId: currentUserId, week } });
    if (!score) {
      score = this.scoresRepo.create({ userId: currentUserId, week });
    }
    score.chaptersCompleted = 3;
    score.avgExamScore = 95;
    score.activeDays = 7;
    score.totalScore = 3 * 100 + 95 + 7 * 10; // 465
    await this.scoresRepo.save(score);

    // Create simulated 2nd and 3rd place users (use existing users or fake entries)
    const allUsers = await this.usersRepo.find({ take: 10, order: { totalXp: 'DESC' } });
    const otherUsers = allUsers.filter(u => u.id !== currentUserId).slice(0, 2);

    for (let i = 0; i < otherUsers.length; i++) {
      let otherScore = await this.scoresRepo.findOne({ where: { userId: otherUsers[i].id, week } });
      if (!otherScore) {
        otherScore = this.scoresRepo.create({ userId: otherUsers[i].id, week });
      }
      otherScore.chaptersCompleted = 2 - i;
      otherScore.avgExamScore = 85 - i * 10;
      otherScore.activeDays = 5 - i;
      otherScore.totalScore = otherScore.chaptersCompleted * 100 + otherScore.avgExamScore + otherScore.activeDays * 10;
      await this.scoresRepo.save(otherScore);
    }

    // Now run the real distribution
    const results = await this.distributeWeeklyRewards(week);

    return {
      message: `🏆 Demo: Podio de la semana ${week} distribuido`,
      week,
      winners: results.map(r => ({
        position: r.position,
        userId: r.userId,
        rewardUsd: r.rewardUsd,
        rewardXlm: r.rewardXlm,
        txHash: r.txHash,
        nftTxHash: r.nftTxHash,
        status: r.status,
      })),
    };
  }

  // Distribute weekly rewards (called by admin or cron)
  async distributeWeeklyRewards(week?: string) {
    if (this.paused) {
      throw new ForbiddenException('Rewards distribution is paused (circuit breaker)');
    }

    const targetWeek = week || this.getCurrentWeek();
    const scores = await this.scoresRepo.find({
      where: { week: targetWeek },
      order: { totalScore: 'DESC' },
      take: 3,
      relations: ['user'],
    });

    const rewardAmounts = [15, 10, 5]; // USD
    const results: PodiumReward[] = [];

    for (let i = 0; i < Math.min(scores.length, 3); i++) {
      const score = scores[i];
      const user = score.user;
      const rewardUsd = rewardAmounts[i];

      // Plan gate disabled for demo
      // if (user?.plan === 'free') continue;

      const reward = this.rewardsRepo.create({
        userId: score.userId,
        week: targetWeek,
        position: i + 1,
        rewardUsd,
      });

      if (user.stellarPublicKey) {
        // Convert USD to XLM (simplified - in production use real exchange rate)
        const xlmAmount = (rewardUsd / 0.15).toFixed(2); // Approximate rate
        reward.rewardXlm = xlmAmount;

        // TODO: Set REWARD_POOL_SECRET in .env — the funded Stellar account that sends rewards
        const rewardPoolSecret = process.env.REWARD_POOL_SECRET;
        let txHash = `SIMULATED_REWARD_${targetWeek}_${i + 1}_${Date.now()}`;

        try {
          if (rewardPoolSecret) {
            const result = await this.stellarService.sendXLMReward(
              rewardPoolSecret,
              user.stellarPublicKey,
              xlmAmount,
            );
            if (result.success && result.txHash) {
              txHash = result.txHash;
              reward.status = 'paid';
            } else {
              this.logger.error(`XLM transfer failed for ${user.username}: ${result.error}`);
              reward.status = 'pending';
            }
          } else {
            // No reward pool configured — simulate
            this.logger.warn('[Podium] REWARD_POOL_SECRET not set, using simulated txHash');
            reward.status = 'paid';
          }
        } catch (err) {
          this.logger.error(`Reward payment failed for ${user.username}: ${err.message}`);
          reward.status = 'pending';
        }

        reward.txHash = txHash;

        // Mint podium NFT on Soroban
        try {
          const xlmStroops = Math.round(parseFloat(xlmAmount) * 10_000_000);
          const nftResult = await this.sorobanService.mintPodiumNft({
            week: targetWeek,
            userPublicKey: user.stellarPublicKey,
            rank: i + 1,
            xlmRewardStroops: xlmStroops,
            txHash,
          });
          if (nftResult.success) {
            reward.nftTxHash = nftResult.txHash;
            this.logger.log(`Podium NFT minted for ${user.username} (rank ${i + 1}), tx=${nftResult.txHash}`);
          }
        } catch (nftErr) {
          this.logger.error(`Podium NFT mint failed for ${user.username}: ${nftErr.message}`);
        }
      } else {
        // No wallet — retain for 7 days
        reward.status = 'retained';
        reward.retainedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }

      const saved = await this.rewardsRepo.save(reward);
      results.push(saved);
    }

    return results;
  }
}
