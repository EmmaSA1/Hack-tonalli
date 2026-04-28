import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  const TEST_MASTER_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  beforeEach(async () => {
    process.env.ENCRYPTION_MASTER_KEY = TEST_MASTER_KEY;

    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_MASTER_KEY;
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a secret key correctly', () => {
      const plaintext = 'SCZOWNMBYJ7GZCYV3DSMXKV3VMT3GZ2XI5B3FPZTE2IUQRR7HYCWX2W';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'SCZOWNMBYJ7GZCYV3DSMXKV3VMT3GZ2XI5B3FPZTE2IUQRR7HYCWX2W';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should return null as-is without throwing', () => {
      expect(service.encrypt(null as any)).toBeNull();
      expect(service.decrypt(null as any)).toBeNull();
    });

    it('should return undefined as-is without throwing', () => {
      expect(service.encrypt(undefined as any)).toBeUndefined();
      expect(service.decrypt(undefined as any)).toBeUndefined();
    });

    it('should handle special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted value', () => {
      const encrypted = service.encrypt('some-secret');
      expect(service.isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plaintext secret key', () => {
      const plaintext = 'SCZOWNMBYJ7GZCYV3DSMXKV3VMT3GZ2XI5B3FPZTE2IUQRR7HYCWX2W';
      expect(service.isEncrypted(plaintext)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(service.isEncrypted(null as any)).toBe(false);
      expect(service.isEncrypted(undefined as any)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(service.isEncrypted('')).toBe(false);
    });

    it('should return false for value without proper format', () => {
      expect(service.isEncrypted('just-a-plain-text')).toBe(false);
      expect(service.isEncrypted('incomplete:format')).toBe(false);
    });
  });

  describe('decrypt with invalid input', () => {
    it('should throw error for invalid ciphertext format', () => {
      expect(() => service.decrypt('invalid')).toThrow('Invalid ciphertext format');
    });
  });
});