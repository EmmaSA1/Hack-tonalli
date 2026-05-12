import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import { ConfigService } from '@nestjs/config';

describe('EncryptionService', () => {
  let service: EncryptionService;
  const mockEncryptionKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 hex chars = 32 bytes

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockEncryptionKey),
          },
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should encrypt and decrypt correctly', () => {
    const originalText = 'S...SECRET_KEY...';
    const encrypted = service.encrypt(originalText);
    
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(originalText);
    expect(encrypted.split(':')).toHaveLength(3);
    
    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toEqual(originalText);
  });

  it('should return original text if not encrypted (no colon)', () => {
    const text = 'plain_text';
    const result = service.decrypt(text);
    expect(result).toEqual(text);
  });

  it('should return original text if decryption fails', () => {
    const invalidEncrypted = 'iv:tag:invalid_data';
    const result = service.decrypt(invalidEncrypted);
    expect(result).toEqual(invalidEncrypted);
  });
  
  it('should throw error if ENCRYPTION_KEY is missing', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    expect(() => module.get<EncryptionService>(EncryptionService)).toThrow();
  });
});
