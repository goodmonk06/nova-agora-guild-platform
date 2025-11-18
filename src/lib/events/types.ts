/**
 * Domain Events
 *
 * Typed events for cross-cutting concerns (notifications, analytics, integrations).
 * Allows loose coupling between domain logic and side effects.
 */

export type DomainEvent =
  | GuildCreatedEvent
  | GuildJoinedEvent
  | PostCreatedEvent
  | ThreadCreatedEvent
  | QuestCreatedEvent
  | QuestSubmittedEvent
  | QuestCompletedEvent
  | ReactionAddedEvent
  | MemberPromotedEvent;

export interface BaseEvent {
  type: string;
  timestamp: Date;
  userId: string;
  guildId?: string;
  metadata?: Record<string, unknown>;
}

export interface GuildCreatedEvent extends BaseEvent {
  type: "GUILD_CREATED";
  payload: {
    guildId: string;
    guildName: string;
    guildSlug: string;
    creatorId: string;
  };
}

export interface GuildJoinedEvent extends BaseEvent {
  type: "GUILD_JOINED";
  payload: {
    guildId: string;
    guildName: string;
    userId: string;
    userName: string | null;
    role: string;
  };
}

export interface PostCreatedEvent extends BaseEvent {
  type: "POST_CREATED";
  payload: {
    postId: string;
    content: string;
    authorId: string;
    threadId?: string;
    guildId?: string;
  };
}

export interface ThreadCreatedEvent extends BaseEvent {
  type: "THREAD_CREATED";
  payload: {
    threadId: string;
    title: string;
    channelId: string;
    authorId: string;
    guildId: string;
  };
}

export interface QuestCreatedEvent extends BaseEvent {
  type: "QUEST_CREATED";
  payload: {
    questId: string;
    title: string;
    points: number;
    deadline?: Date;
    guildId: string;
    creatorId: string;
  };
}

export interface QuestSubmittedEvent extends BaseEvent {
  type: "QUEST_SUBMITTED";
  payload: {
    submissionId: string;
    questId: string;
    questTitle: string;
    userId: string;
    guildId: string;
  };
}

export interface QuestCompletedEvent extends BaseEvent {
  type: "QUEST_COMPLETED";
  payload: {
    submissionId: string;
    questId: string;
    questTitle: string;
    userId: string;
    pointsAwarded: number;
    guildId: string;
  };
}

export interface ReactionAddedEvent extends BaseEvent {
  type: "REACTION_ADDED";
  payload: {
    reactionId: string;
    type: string;
    postId: string;
    authorId: string;
    reactorId: string;
  };
}

export interface MemberPromotedEvent extends BaseEvent {
  type: "MEMBER_PROMOTED";
  payload: {
    userId: string;
    guildId: string;
    oldRole: string;
    newRole: string;
    promoterId: string;
  };
}
