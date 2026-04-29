import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from '@nestjs/cache-manager';
import { PodiumController } from './podium.controller';
import { PodiumService } from './podium.service';

describe('PodiumController Caching', () => {
  let controller: PodiumController;
  let podiumService: PodiumService;

  const mockPodiumService = {
    getWeeklyLeaderboard: jest.fn().mockResolvedValue({
      week: '2026-W17',
      rankings: [
        { rank: 1, username: 'user1', totalScore: 100 },
        { rank: 2, username: 'user2', totalScore: 90 },
      ],
    }),
    getGlobalLeaderboard: jest.fn().mockResolvedValue([
      { rank: 1, username: 'leader1', xp: 500 },
      { rank: 2, username: 'leader2', xp: 400 },
    ]),
    getUserPodiumNfts: jest.fn().mockResolvedValue([]),
    distributeWeeklyRewards: jest.fn().mockResolvedValue([
      { userId: '1', position: 1, rewardXlm: '15' },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PodiumController],
      imports: [CacheModule.register({ ttl: 5000 })],
      providers: [
        { provide: PodiumService, useValue: mockPodiumService },
      ],
    }).compile();

    controller = module.get<PodiumController>(PodiumController);
    podiumService = module.get<PodiumService>(PodiumService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGlobalLeaderboard', () => {
    it('should return global leaderboard', async () => {
      const result = await controller.getGlobalLeaderboard();

      expect(podiumService.getGlobalLeaderboard).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].username).toBe('leader1');
    });

    it('should call service to fetch leaderboard', async () => {
      await controller.getGlobalLeaderboard();

      expect(podiumService.getGlobalLeaderboard).toHaveBeenCalled();
    });
  });

  describe('getWeeklyLeaderboard', () => {
    it('should return weekly leaderboard for user', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const result = await controller.getWeeklyLeaderboard(mockRequest);

      expect(podiumService.getWeeklyLeaderboard).toHaveBeenCalledWith('user-123');
      expect(result.week).toBe('2026-W17');
    });
  });

  describe('getUserPodiumNfts', () => {
    it('should return user podium NFTs', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const result = await controller.getUserPodiumNfts(mockRequest);

      expect(podiumService.getUserPodiumNfts).toHaveBeenCalledWith('user-123');
      expect(result).toHaveLength(0);
    });
  });

  describe('distributeRewards', () => {
    it('should distribute weekly rewards', async () => {
      const result = await controller.distributeRewards();

      expect(podiumService.distributeWeeklyRewards).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });
});