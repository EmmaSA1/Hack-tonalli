import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { StellarService } from '../stellar/stellar.service';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const mockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  password: 'hashed_password',
  displayName: 'Test User',
  xp: 0,
  totalXp: 0,
  currentStreak: 0,
  stellarPublicKey: 'GABC123',
  externalWalletAddress: null,
  walletType: 'custodial',
  character: 'chima',
  role: 'user',
  plan: 'free',
  isFirstLogin: true,
  companion: null,
  avatarType: null,
  isFunded: false,
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    findByUsername: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };
  let stellarService: {
    createKeypair: jest.Mock;
    fundWithFriendbot: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('mock_token') };
    stellarService = {
      createKeypair: jest.fn().mockReturnValue({
        publicKey: 'GABC123',
        secretKey: 'SABC123',
      }),
      fundWithFriendbot: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: StellarService, useValue: stellarService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    const dto = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'password123',
    };

    it('registers a new user and returns token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      usersService.create.mockResolvedValue(
        mockUser({ email: dto.email, username: dto.username }),
      );

      const result = await service.register(dto as any);

      expect(result.access_token).toBe('mock_token');
      expect(result.user.email).toBe(dto.email);
      expect(stellarService.createKeypair).toHaveBeenCalled();
    });

    it('throws ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser());

      await expect(service.register(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException if username already taken', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(mockUser());

      await expect(service.register(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws BadRequestException if user is under 18', async () => {
      const underageDob = new Date();
      underageDob.setFullYear(underageDob.getFullYear() - 17);

      await expect(
        service.register({
          ...dto,
          dateOfBirth: underageDob.toISOString(),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows registration for user exactly 18 years old', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      usersService.create.mockResolvedValue(mockUser());

      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 18);

      const result = await service.register({
        ...dto,
        dateOfBirth: dob.toISOString(),
      } as any);
      expect(result.access_token).toBe('mock_token');
    });

    it('calls fundWithFriendbot after registration', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      usersService.create.mockResolvedValue(mockUser());

      await service.register(dto as any);

      // fundWithFriendbot is called async (fire-and-forget), give it a tick
      await new Promise((r) => setTimeout(r, 0));
      expect(stellarService.fundWithFriendbot).toHaveBeenCalledWith('GABC123');
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    const dto = { email: 'test@example.com', password: 'password123' };

    it('returns token on valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser());
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto as any);
      expect(result.access_token).toBe('mock_token');
      expect(result.user.email).toBe(dto.email);
    });

    it('throws UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(dto as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException if password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser());
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
