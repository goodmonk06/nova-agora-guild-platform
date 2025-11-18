/**
 * Analytics Provider Interface
 *
 * Allows plugging in different analytics backends (internal, Google Analytics, Mixpanel, etc.).
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  userId?: string;
  timestamp?: Date;
}

export interface IAnalyticsProvider {
  /**
   * Track an event
   */
  track(event: AnalyticsEvent): Promise<void>;

  /**
   * Track multiple events in batch
   */
  trackBatch(events: AnalyticsEvent[]): Promise<void>;

  /**
   * Identify a user with properties
   */
  identify(userId: string, properties: Record<string, unknown>): Promise<void>;

  /**
   * Check if provider is healthy/available
   */
  healthCheck(): Promise<boolean>;
}

/**
 * In-memory analytics provider (default/fallback)
 */
export class InMemoryAnalyticsProvider implements IAnalyticsProvider {
  private events: AnalyticsEvent[] = [];

  async track(event: AnalyticsEvent): Promise<void> {
    this.events.push({ ...event, timestamp: event.timestamp ?? new Date() });
    console.log(`[Analytics] Event tracked: ${event.name}`);
  }

  async trackBatch(events: AnalyticsEvent[]): Promise<void> {
    const timestampedEvents = events.map((e) => ({
      ...e,
      timestamp: e.timestamp ?? new Date(),
    }));
    this.events.push(...timestampedEvents);
    console.log(`[Analytics] ${events.length} events tracked`);
  }

  async identify(userId: string, properties: Record<string, unknown>): Promise<void> {
    console.log(`[Analytics] User identified: ${userId}`, properties);
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  // Test helper
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}

/**
 * Mixpanel analytics provider (example)
 */
export class MixpanelAnalyticsProvider implements IAnalyticsProvider {
  constructor(private token: string) {}

  async track(event: AnalyticsEvent): Promise<void> {
    // TODO: Implement Mixpanel API call
    console.log(`[Mixpanel] Would track event: ${event.name}`);
  }

  async trackBatch(events: AnalyticsEvent[]): Promise<void> {
    console.log(`[Mixpanel] Would track ${events.length} events`);
  }

  async identify(userId: string, properties: Record<string, unknown>): Promise<void> {
    console.log(`[Mixpanel] Would identify user: ${userId}`);
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

/**
 * Analytics provider registry
 */
class AnalyticsProviderRegistry {
  private provider: IAnalyticsProvider = new InMemoryAnalyticsProvider();

  setProvider(provider: IAnalyticsProvider): void {
    this.provider = provider;
  }

  getProvider(): IAnalyticsProvider {
    return this.provider;
  }
}

export const analyticsRegistry = new AnalyticsProviderRegistry();
