import { Injectable } from '@nestjs/common';
import * as PostHog from 'posthog-node';

@Injectable()
export class PostHogService {
  private posthog: PostHog;

  constructor() {
    this.posthog = new PostHog('your-project-api-key', {
      host: 'your-posthog-host',
    });
  }

  capture(event: string, properties?: Record<string, any>, distinctId?: string) {
    this.posthog.capture({
      distinctId: distinctId || 'anonymous',
      event,
      properties,
    });
  }

  identify(distinctId: string, properties?: Record<string, any>) {
    this.posthog.identify({
      distinctId,
      properties,
    });
  }

  onModuleDestroy() {
    this.posthog.shutdown();
  }
}