import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { getConnectionToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the entire @stellar/stellar-sdk module
jest.mock('@stellar/stellar-sdk', () => {
  const mockCall = jest.fn();
  const mockLimit = jest.fn(() => ({ call: mockCall }));
  const mockLedgers = jest.fn(() => ({ limit: mockLimit }));
  return {
    Horizon: {
      Server: jest.fn().mockImplementation(() => ({
        ledgers: mockLedgers,
      })),
    },
    __mockCall: mockCall,
  };
});

describe('HealthService', () => {
  let service: HealthService;
  let mockConnection: { query: jest.Mock };
  let mockConfigService: { get: jest.Mock };

  // Grab the mocked call fn from the module
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const StellarSdkMock = require('@stellar/stellar-sdk');

  beforeEach(async () => {
    mockConnection = { query: jest.fn() };
    mockConfigService = { get: jest.fn().mockReturnValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHealthStatus – all healthy', () => {
    it('returns status ok when db, soroban and acta are all up', async () => {
      mockConnection.query.mockResolvedValue([]);
      StellarSdkMock.__mockCall.mockResolvedValue({
        records: [{ id: '1' }],
      });
      mockedAxios.get.mockResolvedValue({ status: 200, data: { ok: true } });

      const result = await service.getHealthStatus();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(result.soroban).toBe('live');
      expect(result.acta).toBe('reachable');
      expect(result.timestamp).toBeDefined();
      expect(result.details).toBeUndefined();
    });
  });

  describe('getHealthStatus – database down', () => {
    it('returns degraded when only db fails', async () => {
      mockConnection.query.mockRejectedValue(
        new Error('DB connection refused'),
      );
      StellarSdkMock.__mockCall.mockResolvedValue({
        records: [{ id: '1' }],
      });
      mockedAxios.get.mockResolvedValue({ status: 200, data: { ok: true } });

      const result = await service.getHealthStatus();

      expect(result.status).toBe('degraded');
      expect(result.database).toBe('disconnected');
      expect(result.soroban).toBe('live');
      expect(result.acta).toBe('reachable');
    });
  });

  describe('getHealthStatus – soroban down', () => {
    it('returns degraded when soroban returns empty records', async () => {
      mockConnection.query.mockResolvedValue([]);
      StellarSdkMock.__mockCall.mockResolvedValue({ records: [] });
      mockedAxios.get.mockResolvedValue({ status: 200, data: { ok: true } });

      const result = await service.getHealthStatus();

      expect(result.status).toBe('degraded');
      expect(result.soroban).toBe('unreachable');
      expect(result.details?.soroban).toBe('No ledger data returned');
    });

    it('returns degraded when soroban throws', async () => {
      mockConnection.query.mockResolvedValue([]);
      StellarSdkMock.__mockCall.mockRejectedValue(new Error('Network timeout'));
      mockedAxios.get.mockResolvedValue({ status: 200, data: { ok: true } });

      const result = await service.getHealthStatus();

      expect(result.soroban).toBe('unreachable');
    });
  });

  describe('getHealthStatus – acta down', () => {
    it('returns degraded when acta returns non-200', async () => {
      mockConnection.query.mockResolvedValue([]);
      StellarSdkMock.__mockCall.mockResolvedValue({ records: [{ id: '1' }] });
      mockedAxios.get.mockResolvedValue({ status: 503, data: null });

      const result = await service.getHealthStatus();

      expect(result.acta).toBe('unreachable');
      expect(result.details?.acta).toContain('503');
    });

    it('returns degraded when acta throws', async () => {
      mockConnection.query.mockResolvedValue([]);
      StellarSdkMock.__mockCall.mockResolvedValue({ records: [{ id: '1' }] });
      mockedAxios.get.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await service.getHealthStatus();

      expect(result.acta).toBe('unreachable');
    });
  });

  describe('getHealthStatus – all down', () => {
    it('returns down when everything fails', async () => {
      mockConnection.query.mockRejectedValue(new Error('DB down'));
      StellarSdkMock.__mockCall.mockRejectedValue(new Error('Stellar down'));
      mockedAxios.get.mockRejectedValue(new Error('Acta down'));

      const result = await service.getHealthStatus();

      expect(result.status).toBe('down');
      expect(result.database).toBe('disconnected');
      expect(result.soroban).toBe('unreachable');
      expect(result.acta).toBe('unreachable');
    });
  });

  describe('getHealthStatus – details populated on partial failure', () => {
    it('includes details object when some checks fail', async () => {
      mockConnection.query.mockRejectedValue(new Error('timeout'));
      StellarSdkMock.__mockCall.mockResolvedValue({ records: [{ id: '1' }] });
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} });

      const result = await service.getHealthStatus();

      expect(result.details).toBeDefined();
    });
  });
});
