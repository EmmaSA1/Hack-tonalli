import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { User } from '../users/entities/user.entity';

type PlanType = 'free' | 'pro' | 'max';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async createCheckoutSession(userId: string, plan: 'pro' | 'max') {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stripe = this.getStripe();
    const customer = user.stripeCustomerId
      ? { id: user.stripeCustomerId }
      : await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id },
          name: user.displayName || user.username,
        });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [
        {
          price: this.getPriceId(plan),
          quantity: 1,
        },
      ],
      client_reference_id: user.id,
      metadata: { userId: user.id, plan },
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
      success_url: `${this.getWebAppUrl()}/premium?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.getWebAppUrl()}/premium?checkout=cancelled`,
    });

    await this.usersRepo.save({
      ...user,
      stripeCustomerId: customer.id,
      stripeCheckoutSessionId: session.id,
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('Missing STRIPE_WEBHOOK_SECRET');
    }

    const stripe = this.getStripe();
    const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

    // Webhook keeps the subscription source of truth in sync with the DB.
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.handleSubscriptionChanged(event.data.object as Stripe.Subscription);
        break;
      default:
        this.logger.debug(`Ignoring Stripe event ${event.type}`);
    }

    return { received: true, type: event.type };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId || session.client_reference_id;
    if (!userId) {
      this.logger.warn(`checkout.session.completed missing user reference: ${session.id}`);
      return;
    }

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`checkout.session.completed user not found: ${userId}`);
      return;
    }

    const plan = this.normalizePlan(session.metadata?.plan);
    await this.usersRepo.save({
      ...user,
      plan: plan || user.plan,
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : user.stripeCustomerId,
      stripeCheckoutSessionId: session.id,
      stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : user.stripeSubscriptionId,
      stripeSubscriptionStatus: session.payment_status || user.stripeSubscriptionStatus,
    });
  }

  private async handleSubscriptionChanged(subscription: Stripe.Subscription) {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
    const metadataUserId = subscription.metadata?.userId;

    const user = metadataUserId
      ? await this.usersRepo.findOne({ where: { id: metadataUserId } })
      : await this.usersRepo.findOne({
          where: [
            { stripeSubscriptionId: subscription.id },
            { stripeCustomerId: customerId || '' },
          ],
        });

    if (!user) {
      this.logger.warn(`subscription event could not be matched: ${subscription.id}`);
      return;
    }

    const plan =
      this.normalizePlan(subscription.metadata?.plan) ||
      this.planFromPriceId(subscription.items.data[0]?.price?.id) ||
      user.plan;

    const activeStatuses = new Set(['trialing', 'active', 'past_due']);
    const nextPlan = activeStatuses.has(subscription.status) ? plan : 'free';

    await this.usersRepo.save({
      ...user,
      plan: nextPlan,
      stripeCustomerId: customerId || user.stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
    });
  }

  private getStripe(): Stripe {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('Missing STRIPE_SECRET_KEY');
    }
    return new Stripe(apiKey);
  }

  private getPriceId(plan: 'pro' | 'max'): string {
    const envKey = plan === 'pro' ? 'STRIPE_PRO_PRICE_ID' : 'STRIPE_MAX_PRICE_ID';
    const priceId = process.env[envKey];
    if (!priceId) {
      throw new InternalServerErrorException(`Missing ${envKey}`);
    }
    return priceId;
  }

  private getWebAppUrl(): string {
    return process.env.WEB_APP_URL || 'http://localhost:5173';
  }

  private normalizePlan(plan?: string): PlanType | null {
    return plan === 'free' || plan === 'pro' || plan === 'max' ? plan : null;
  }

  private planFromPriceId(priceId?: string): PlanType | null {
    if (!priceId) return null;
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
    if (priceId === process.env.STRIPE_MAX_PRICE_ID) return 'max';
    return null;
  }
}
