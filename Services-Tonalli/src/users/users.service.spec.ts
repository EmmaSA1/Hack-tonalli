import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock StellarSdk for wallet validation
jest.mock('@stellar/stellar-sdk', () => ({
  Keypair: {
    fromPublicKey: jest.fn(),
  },
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const StellarSdk = require('@stellar/stellar-sdk');

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashed',
    displayName: 'Test User',
    city: 'Ciudad de México',
    xp: 100,
    totalXp: 500,
    currentStreak: 5,
    lastActivityDate: null,
    stellarPublicKey: 'GABC123',
    stellarSecretKey: 'SABC123',
    externalWalletAddress: null,
    walletType: 'custodial',
    character: 'chima',
    plan: 'free',
    isFirstLogin: false,
    companion: 'xollo',
    avatarType: 'default',
    isFunded: true,
    role: 'user',
    createdAt: new Date(),
    ...overrides,
  }) as unknown as User;

describe('UsersService', () => {
  let service: UsersService;
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns user when found', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);
      const result = await service.findById('user-1');
      expect(result).toEqual(user);
    });

    it('throws NotFoundException when user not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findByEmail ───────────────────────────────────────────────────────────

  describe('findByEmail', () => {
    it('returns user by email', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);
      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(user);
    });

    it('returns null when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.findByEmail('none@example.com');
      expect(result).toBeNull();
    });
  });

  // ── findByUsername ────────────────────────────────────────────────────────

  describe('findByUsername', () => {
    it('returns user by username', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);
      const result = await service.findByUsername('testuser');
      expect(result).toEqual(user);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates and saves a user', async () => {
      const user = makeUser();
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);
      const result = await service.create({ email: 'test@example.com' });
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual(user);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates and returns the user', async () => {
      const user = makeUser({ xp: 200 });
      repo.update.mockResolvedValue({ affected: 1 });
      repo.findOne.mockResolvedValue(user);
      const result = await service.update('user-1', { xp: 200 });
      expect(repo.update).toHaveBeenCalledWith('user-1', { xp: 200 });
      expect(result.xp).toBe(200);
    });
  });

  // ── addXP ─────────────────────────────────────────────────────────────────

  describe('addXP', () => {
    it('adds XP to user and saves', async () => {
      const user = makeUser({ xp: 100, totalXp: 500 });
      repo.findOne.mockResolvedValue(user);
      repo.save.mockResolvedValue({ ...user, xp: 150, totalXp: 550 });

      const result = await service.addXP('user-1', 50);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ xp: 150, totalXp: 550 }),
      );
      expect(result.xp).toBe(150);
    });
  });

  // ── updateStreak ──────────────────────────────────────────────────────────

  describe('updateStreak', () => {
    it('returns user unchanged if already active today', async () => {
      const today = new Date().toISOString().split('T')[0];
      const user = makeUser({ lastActivityDate: today });
      repo.findOne.mockResolvedValue(user);

      const result = await service.updateStreak('user-1');
      expect(repo.save).not.toHaveBeenCalled();
      expect(result).toEqual(user);
    });

    it('increments streak if last activity was yesterday', async () => {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split('T')[0];
      const user = makeUser({ lastActivityDate: yesterday, currentStreak: 3 });
      repo.findOne.mockResolvedValue(user);
      repo.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.updateStreak('user-1');
      expect(result.currentStreak).toBe(4);
    });

    it('resets streak to 1 if last activity was more than a day ago', async () => {
      const user = makeUser({
        lastActivityDate: '2020-01-01',
        currentStreak: 10,
      });
      repo.findOne.mockResolvedValue(user);
      repo.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.updateStreak('user-1');
      expect(result.currentStreak).toBe(1);
    });
  });

  // ── setupUser ─────────────────────────────────────────────────────────────

  describe('setupUser', () => {
    it('updates companion and avatarType and returns user', async () => {
      const user = makeUser({
        companion: 'xollo',
        avatarType: 'custom',
        isFirstLogin: false,
      });
      repo.update.mockResolvedValue({ affected: 1 });
      repo.findOne.mockResolvedValue(user);

      const result = await service.setupUser('user-1', 'xollo', 'custom');
      expect(repo.update).toHaveBeenCalledWith('user-1', {
        companion: 'xollo',
        avatarType: 'custom',
        isFirstLogin: false,
      });
      expect(result).toEqual(user);
    });
  });

  // ── getProfile ────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns a profile object with expected fields', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);

      const profile = await service.getProfile('user-1');
      expect(profile.id).toBe('user-1');
      expect(profile.email).toBe('test@example.com');
      expect(profile.walletAddress).toBe('GABC123');
    });
  });

  // ── upgradePlan ───────────────────────────────────────────────────────────

  describe('upgradePlan', () => {
    it('upgrades user plan and saves', async () => {
      const user = makeUser({ plan: 'free' });
      repo.findOne.mockResolvedValue(user);
      repo.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.upgradePlan('user-1', 'pro');
      expect(result.plan).toBe('pro');
    });
  });

  // ── connectExternalWallet ─────────────────────────────────────────────────

  describe('connectExternalWallet', () => {
    it('connects a valid external wallet', async () => {
      StellarSdk.Keypair.fromPublicKey.mockReturnValue({});
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);
      repo.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.connectExternalWallet('user-1', 'GVALID123');
      expect(result.externalWalletAddress).toBe('GVALID123');
      expect(result.walletType).toBe('hybrid');
    });

    it('throws BadRequestException for invalid Stellar address', async () => {
      StellarSdk.Keypair.fromPublicKey.mockImplementation(() => {
        throw new Error('Invalid key');
      });

      await expect(
        service.connectExternalWallet('user-1', 'INVALID'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── disconnectExternalWallet ──────────────────────────────────────────────

  describe('disconnectExternalWallet', () => {
    it('clears external wallet and sets type to custodial', async () => {
      const user = makeUser({
        externalWalletAddress: 'GEXT123',
        walletType: 'hybrid',
      });
      repo.findOne.mockResolvedValue(user);
      repo.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.disconnectExternalWallet('user-1');
      expect(result.walletType).toBe('custodial');
    });
  });

  // ── exportSecretKey ───────────────────────────────────────────────────────

  describe('exportSecretKey', () => {
    it('returns secret key on correct password', async () => {
      const user = makeUser({ stellarSecretKey: 'SABC123' });
      repo.findOne.mockResolvedValue(user);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.exportSecretKey(
        'user-1',
        'correct_password',
      );
      expect(result.secretKey).toBe('SABC123');
    });

    it('throws UnauthorizedException on wrong password', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.exportSecretKey('user-1', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws NotFoundException when no secret key exists', async () => {
      const user = makeUser({ stellarSecretKey: null as any });
      repo.findOne.mockResolvedValue(user);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.exportSecretKey('user-1', 'pass')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── getWalletInfo ─────────────────────────────────────────────────────────

  describe('getWalletInfo', () => {
    it('returns wallet info for a user', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);

      const result = await service.getWalletInfo('user-1');
      expect(result.custodialAddress).toBe('GABC123');
      expect(result.walletType).toBe('custodial');
    });
  });

  // ── getRankings ───────────────────────────────────────────────────────────

  describe('getRankings', () => {
    it('returns ranked list of users', async () => {
      const users = [
        makeUser({ totalXp: 1000 }),
        makeUser({ id: 'user-2', totalXp: 500 }),
      ];
      repo.find.mockResolvedValue(users);

      const result = await service.getRankings();
      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
    });
  });
});
