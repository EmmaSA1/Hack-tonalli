import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const usersRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  let service: PaymentsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new PaymentsService(usersRepo as any);
  });

  it('creates a checkout session for a paid plan', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro';
    process.env.WEB_APP_URL = 'http://localhost:5173';

    usersRepo.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'demo@example.com',
      username: 'demo',
      displayName: 'Demo',
      plan: 'free',
    });
    usersRepo.save.mockResolvedValue(undefined);

    const mockStripe = {
      customers: {
        create: jest.fn().mockResolvedValue({ id: 'cus_123' }),
      },
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({
            id: 'cs_123',
            url: 'https://checkout.stripe.test/session',
          }),
        },
      },
    };
    jest.spyOn(service as any, 'getStripe').mockReturnValue(mockStripe);

    const result = await service.createCheckoutSession('user-1', 'pro');

    expect(result.checkoutUrl).toBe('https://checkout.stripe.test/session');
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalled();
    expect(usersRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        stripeCustomerId: 'cus_123',
        stripeCheckoutSessionId: 'cs_123',
      }),
    );
  });

  it('updates the user plan from a checkout webhook', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

    const user = {
      id: 'user-1',
      plan: 'free',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeSubscriptionStatus: null,
    };

    usersRepo.findOne.mockResolvedValue(user);
    usersRepo.save.mockResolvedValue(undefined);

    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          metadata: { userId: 'user-1', plan: 'max' },
          client_reference_id: 'user-1',
          customer: 'cus_123',
          subscription: 'sub_123',
          payment_status: 'paid',
        },
      },
    };

    const mockStripe = {
      webhooks: {
        constructEvent: jest.fn().mockReturnValue(event),
      },
    };
    jest.spyOn(service as any, 'getStripe').mockReturnValue(mockStripe);

    const result = await service.handleWebhook('sig_test', Buffer.from('{}'));

    expect(result.type).toBe('checkout.session.completed');
    expect(usersRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'max',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
      }),
    );
  });
});
