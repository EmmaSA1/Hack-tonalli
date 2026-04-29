import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from '@nestjs/cache-manager';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';

describe('ChaptersController Caching', () => {
  let controller: ChaptersController;
  let chaptersService: ChaptersService;

  const mockChaptersService = {
    findPublishedForUser: jest.fn().mockResolvedValue([
      { id: '1', title: 'Chapter 1', published: true },
      { id: '2', title: 'Chapter 2', published: true },
    ]),
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: '1', title: 'Chapter 1' }),
    create: jest.fn().mockResolvedValue({ id: '1', title: 'New Chapter' }),
    update: jest.fn().mockResolvedValue({ id: '1', title: 'Updated Chapter' }),
    remove: jest.fn().mockResolvedValue(undefined),
    togglePublish: jest.fn().mockResolvedValue({ id: '1', published: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChaptersController],
      imports: [CacheModule.register({ ttl: 5000 })],
      providers: [
        { provide: ChaptersService, useValue: mockChaptersService },
      ],
    }).compile();

    controller = module.get<ChaptersController>(ChaptersController);
    chaptersService = module.get<ChaptersService>(ChaptersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPublished', () => {
    it('should return published chapters for user', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const result = await controller.findPublished(mockRequest);

      expect(chaptersService.findPublishedForUser).toHaveBeenCalledWith('user-123');
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Chapter 1');
    });

    it('should call service to fetch chapters', async () => {
      const mockRequest = { user: { id: 'user-123' } };

      await controller.findPublished(mockRequest);

      expect(chaptersService.findPublishedForUser).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new chapter', async () => {
      const dto = { title: 'New Chapter', description: 'Test' };
      const result = await controller.create(dto);

      expect(chaptersService.create).toHaveBeenCalledWith(dto);
      expect(result.title).toBe('New Chapter');
    });
  });

  describe('update', () => {
    it('should update a chapter', async () => {
      const id = '1';
      const dto = { title: 'Updated Chapter' };
      const result = await controller.update(id, dto);

      expect(chaptersService.update).toHaveBeenCalledWith(id, dto);
      expect(result.title).toBe('Updated Chapter');
    });
  });

  describe('remove', () => {
    it('should remove a chapter', async () => {
      const id = '1';
      await controller.remove(id);

      expect(chaptersService.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('togglePublish', () => {
    it('should toggle chapter publish status', async () => {
      const id = '1';
      const result = await controller.togglePublish(id);

      expect(chaptersService.togglePublish).toHaveBeenCalledWith(id);
      expect(result.published).toBe(true);
    });
  });
});