/**
 * Metrics Abstraction
 *
 * Simple metrics collection for monitoring performance and usage.
 * Can be extended to integrate with Prometheus, StatsD, Datadog, etc.
 */

interface MetricLabels {
  [key: string]: string | number;
}

interface MetricEntry {
  name: string;
  value: number;
  labels?: MetricLabels;
  timestamp: Date;
}

class Metrics {
  private metrics: MetricEntry[] = [];

  /**
   * Record a counter (monotonically increasing value)
   */
  counter(name: string, value = 1, labels?: MetricLabels): void {
    this.record({
      name,
      value,
      labels,
      timestamp: new Date(),
    });
  }

  /**
   * Record a gauge (arbitrary value that can go up or down)
   */
  gauge(name: string, value: number, labels?: MetricLabels): void {
    this.record({
      name,
      value,
      labels,
      timestamp: new Date(),
    });
  }

  /**
   * Record a histogram value (for measuring distributions)
   */
  histogram(name: string, value: number, labels?: MetricLabels): void {
    this.record({
      name,
      value,
      labels,
      timestamp: new Date(),
    });
  }

  /**
   * Time the execution of an async function
   */
  async time<T>(name: string, fn: () => Promise<T>, labels?: MetricLabels): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.histogram(`${name}.duration`, duration, labels);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.histogram(`${name}.duration`, duration, { ...labels, error: "true" });
      throw error;
    }
  }

  private record(entry: MetricEntry): void {
    this.metrics.push(entry);

    // In development, log metrics
    if (process.env.NODE_ENV !== "production") {
      const labelsStr = entry.labels
        ? ` ${JSON.stringify(entry.labels)}`
        : "";
      console.log(`[Metrics] ${entry.name}=${entry.value}${labelsStr}`);
    }

    // In production, this would send to a metrics backend
    // TODO: Integrate with Prometheus, StatsD, or Datadog
  }

  /**
   * Get all recorded metrics (for testing/debugging)
   */
  getMetrics(): MetricEntry[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics (for testing)
   */
  clear(): void {
    this.metrics = [];
  }
}

// Export singleton instance
export const metrics = new Metrics();

// Export class for creating scoped metrics instances
export { Metrics };

// Common metric names (for consistency)
export const METRICS = {
  // Guild metrics
  GUILD_CREATED: "guild.created",
  GUILD_JOINED: "guild.joined",
  GUILD_LEFT: "guild.left",

  // Post metrics
  POST_CREATED: "post.created",
  POST_EDITED: "post.edited",
  POST_DELETED: "post.deleted",

  // Quest metrics
  QUEST_CREATED: "quest.created",
  QUEST_SUBMITTED: "quest.submitted",
  QUEST_COMPLETED: "quest.completed",

  // Reaction metrics
  REACTION_ADDED: "reaction.added",
  REACTION_REMOVED: "reaction.removed",

  // Performance metrics
  API_REQUEST: "api.request",
  API_ERROR: "api.error",
  DB_QUERY: "db.query",

  // User metrics
  USER_SIGNUP: "user.signup",
  USER_LOGIN: "user.login",
  USER_ACTIVE: "user.active",
} as const;
