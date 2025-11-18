/**
 * Notification Provider Interface
 *
 * Allows plugging in different notification backends (email, push, SMS, webhooks).
 * This makes the notification system extensible without coupling to specific providers.
 */

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, unknown>;
  resourceType?: string;
  resourceId?: string;
}

export interface INotificationProvider {
  /**
   * Send a notification to a user
   */
  send(payload: NotificationPayload): Promise<void>;

  /**
   * Send notifications to multiple users (batch)
   */
  sendBatch(payloads: NotificationPayload[]): Promise<void>;

  /**
   * Check if provider is healthy/available
   */
  healthCheck(): Promise<boolean>;
}

/**
 * In-memory notification provider (default/fallback)
 * Stores notifications in database only, doesn't send external notifications
 */
export class InMemoryNotificationProvider implements INotificationProvider {
  private notifications: NotificationPayload[] = [];

  async send(payload: NotificationPayload): Promise<void> {
    this.notifications.push(payload);
    console.log(`[NotificationProvider] Notification queued for ${payload.userId}:`, payload.title);
  }

  async sendBatch(payloads: NotificationPayload[]): Promise<void> {
    this.notifications.push(...payloads);
    console.log(`[NotificationProvider] ${payloads.length} notifications queued`);
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  // Test helper
  getNotifications(): NotificationPayload[] {
    return [...this.notifications];
  }

  clear(): void {
    this.notifications = [];
  }
}

/**
 * Email notification provider (example implementation)
 */
export class EmailNotificationProvider implements INotificationProvider {
  constructor(private config: { smtpHost: string; smtpPort: number; from: string }) {}

  async send(payload: NotificationPayload): Promise<void> {
    // TODO: Implement actual email sending logic
    console.log(`[EmailProvider] Would send email to user ${payload.userId}:`, payload.title);
  }

  async sendBatch(payloads: NotificationPayload[]): Promise<void> {
    // TODO: Implement batch email sending
    console.log(`[EmailProvider] Would send ${payloads.length} emails`);
  }

  async healthCheck(): Promise<boolean> {
    // TODO: Check SMTP connection
    return true;
  }
}

/**
 * Webhook notification provider (example for Discord/Slack)
 */
export class WebhookNotificationProvider implements INotificationProvider {
  constructor(private webhookUrl: string) {}

  async send(payload: NotificationPayload): Promise<void> {
    try {
      await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `**${payload.title}**\n${payload.message}`,
          embeds: payload.data ? [{ description: JSON.stringify(payload.data) }] : [],
        }),
      });
    } catch (error) {
      console.error("[WebhookProvider] Failed to send notification:", error);
    }
  }

  async sendBatch(payloads: NotificationPayload[]): Promise<void> {
    // Send webhooks sequentially or in small batches
    for (const payload of payloads) {
      await this.send(payload);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.webhookUrl, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Notification provider registry
 * Allows swapping providers at runtime
 */
class NotificationProviderRegistry {
  private provider: INotificationProvider = new InMemoryNotificationProvider();

  setProvider(provider: INotificationProvider): void {
    this.provider = provider;
  }

  getProvider(): INotificationProvider {
    return this.provider;
  }
}

export const notificationRegistry = new NotificationProviderRegistry();
