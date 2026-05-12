import { SecurityInterceptor } from './security.interceptor';
import { of } from 'rxjs';

describe('SecurityInterceptor', () => {
  let interceptor: SecurityInterceptor;

  beforeEach(() => {
    interceptor = new SecurityInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should remove stellarSecretKey from response', (done) => {
    const mockData = {
      id: '1',
      username: 'testuser',
      stellarPublicKey: 'G...',
      stellarSecretKey: 'S...',
    };

    const mockExecutionContext = {} as any;
    const mockCallHandler = {
      handle: () => of(mockData),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result.stellarSecretKey).toBeUndefined();
      expect(result.secretKey).toBeUndefined();
      expect(result.username).toEqual('testuser');
      done();
    });
  });

  it('should remove secretKey and encryptedSecret', (done) => {
    const mockData = {
      secretKey: 'S...',
      encryptedSecret: 'E...',
      public: 'G...',
    };

    const mockExecutionContext = {} as any;
    const mockCallHandler = {
      handle: () => of(mockData),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result.secretKey).toBeUndefined();
      expect(result.encryptedSecret).toBeUndefined();
      expect(result.public).toEqual('G...');
      done();
    });
  });

  it('should remove stellarSecretKey from nested objects', (done) => {
    const mockData = {
      user: {
        id: '1',
        stellarSecretKey: 'S...',
      },
      other: 'data',
    };

    const mockExecutionContext = {} as any;
    const mockCallHandler = {
      handle: () => of(mockData),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result.user.stellarSecretKey).toBeUndefined();
      expect(result.other).toEqual('data');
      done();
    });
  });

  it('should remove stellarSecretKey from arrays', (done) => {
    const mockData = [
      { id: '1', stellarSecretKey: 'S1' },
      { id: '2', stellarSecretKey: 'S2' },
    ];

    const mockExecutionContext = {} as any;
    const mockCallHandler = {
      handle: () => of(mockData),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result[0].stellarSecretKey).toBeUndefined();
      expect(result[1].stellarSecretKey).toBeUndefined();
      expect(result).toHaveLength(2);
      done();
    });
  });
});
