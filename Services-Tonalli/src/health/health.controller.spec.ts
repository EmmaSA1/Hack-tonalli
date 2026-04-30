import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HealthStatus } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: { getHealthStatus: jest.Mock };

  const mockStatus: HealthStatus = {
    status: 'ok',
    database: 'connected',
    soroban: 'live',
    acta: 'reachable',
    timestamp: new Date().toISOString(),
  };

  beforeEach(async () => {
    healthService = {
      getHealthStatus: jest.fn().mockResolvedValue(mockStatus),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('checkHealth delegates to HealthService and returns result', async () => {
    const result = await controller.checkHealth();
    expect(healthService.getHealthStatus).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockStatus);
  });

  it('checkHealth returns degraded status when service reports degraded', async () => {
    const degraded: HealthStatus = {
      ...mockStatus,
      status: 'degraded',
      soroban: 'unreachable',
    };
    healthService.getHealthStatus.mockResolvedValue(degraded);

    const result = await controller.checkHealth();
    expect(result.status).toBe('degraded');
  });
});
