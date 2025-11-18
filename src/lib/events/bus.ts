/**
 * Event Bus
 *
 * Simple in-memory event bus for handling domain events.
 * Allows registering handlers that react to specific event types.
 */

import { type DomainEvent } from "./types";

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register a handler for a specific event type
   */
  on<T extends DomainEvent>(eventType: T["type"], handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler as EventHandler]);
  }

  /**
   * Register a handler that runs for all events
   */
  onAny(handler: EventHandler): void {
    this.on("*" as any, handler);
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit(event: DomainEvent): Promise<void> {
    // Get handlers for this specific type
    const typeHandlers = this.handlers.get(event.type) ?? [];

    // Get wildcard handlers
    const wildcardHandlers = this.handlers.get("*") ?? [];

    const allHandlers = [...typeHandlers, ...wildcardHandlers];

    // Execute all handlers (in parallel for better performance)
    await Promise.allSettled(
      allHandlers.map((handler) => Promise.resolve(handler(event)))
    );
  }

  /**
   * Remove all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Remove handlers for a specific event type
   */
  off(eventType: string): void {
    this.handlers.delete(eventType);
  }
}

// Singleton instance
export const eventBus = new EventBus();
