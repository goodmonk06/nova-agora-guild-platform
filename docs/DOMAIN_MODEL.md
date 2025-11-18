# Domain Model

## Overview

Nova Agora's domain model represents a **supporter-exclusive community platform** centered around "Guilds" - project-based communities where creators and supporters engage deeply.

## Entity Relationship Diagram

```
User ──┬── Membership ─── Guild
       ├── Post ─────────┬─── Guild (feed posts)
       ├── Reaction      │
       ├── Activity      └─── Thread ─── Channel ─── Guild
       ├── Notification
       ├── QuestSubmission ─── Quest ─── Guild
       └── Account/Session (NextAuth)

Guild ──┬── Membership
        ├── Channel ─── Thread ─── Post
        ├── Quest ─── QuestSubmission
        ├── Post (guild feed)
        ├── Activity
        ├── Integration
        └── GuildMetric

Tag ─── TagRelation ─┬─── Post
                     ├─── Thread
                     └─── Quest
```

## Core Entities

### User

**Purpose**: Represents platform users - both creators and supporters.

**Key Fields**:
- `name`, `email`, `image`: Basic profile
- `bio`, `website`, `twitter`: Extended profile
- `totalPoints`: Aggregate points across all guilds
- `preferences`: JSON field for user settings (notification prefs, UI theme, etc.)
- `lastActiveAt`: Track user activity for engagement metrics

**Relationships**:
- Has many **Memberships** (guilds they've joined)
- Creates **Posts**, **Reactions**, **QuestSubmissions**
- Receives **Notifications**
- Generates **Activities**

**Business Rules**:
- Email must be unique
- Can be member of multiple guilds
- Points are earned through quest completion and contributions

### Guild

**Purpose**: A project-based community space for creators and their supporters.

**Key Fields**:
- `name`, `slug`: Identity and URL-friendly identifier
- `description`, `image`: Branding
- `inviteCode`: Unique code for joining (implements Scarcity strategy)
- `isPublic`: Public guilds anyone can join, private require invite
- `settings`: JSON field for customization (theme, enabled features, permissions)

**Relationships**:
- Has many **Memberships** (members)
- Has many **Channels** (discussion areas)
- Has many **Quests** (challenges for members)
- Has feed **Posts**
- Generates **Activities**
- Has **Integrations** (webhooks, external services)
- Tracked by **GuildMetrics**

**Business Rules**:
- Slug must be unique
- Invite code must be unique
- Must have at least one Admin at all times
- Creator automatically becomes first Admin

### Membership

**Purpose**: Represents a user's participation in a guild with role and points.

**Key Fields**:
- `role`: ADMIN, ELDER, or MEMBER
- `points`: Guild-specific points (separate from global `User.totalPoints`)
- `badges`: Array of achievement badges
- `intro`, `expertise`: Self-introduction for member profile card
- `lastActiveAt`: Track last activity in this guild

**Relationships**:
- Belongs to **User** and **Guild**

**Business Rules**:
- User-Guild combination must be unique (one membership per guild)
- Points cannot be negative
- Admins can manage guild, Elders can moderate, Members have basic access

**Roles**:
- **ADMIN**: Full control (manage members, channels, integrations, delete guild)
- **ELDER**: Moderation powers (pin/lock threads, review quests, manage content)
- **MEMBER**: Basic access (post, react, submit quests)

### Channel

**Purpose**: Topical discussion areas within a guild (similar to Discord channels).

**Key Fields**:
- `name`, `slug`: Channel identity
- `description`: Purpose of the channel
- `isPrivate`: Private channels for specific roles
- `position`: Display order

**Relationships**:
- Belongs to **Guild**
- Has many **Threads**

**Business Rules**:
- Slug must be unique within guild
- Position determines sidebar order
- Default channels created: "general", "announcements"

### Thread

**Purpose**: A conversation topic within a channel.

**Key Fields**:
- `title`, `slug`: Thread identity
- `isPinned`: Admins can pin important threads
- `isLocked`: Prevent new posts (moderation tool)
- `viewCount`: Track engagement

**Relationships**:
- Belongs to **Channel**
- Has many **Posts**
- Can have **Tags** (via TagRelation)

**Business Rules**:
- Slug must be unique within channel
- Locked threads don't accept new posts
- View count increments on each view

### Post

**Purpose**: User-generated content (can be in thread or guild feed).

**Key Fields**:
- `content`: Markdown text content
- `isPinned`: Highlight important posts
- `isAiHighlight`: Flag for AI-generated summary posts
- `metadata`: JSON for rich content (polls, attachments, embeds)
- `threadId`: If in a thread, null if guild feed post
- `guildId`: If guild feed post, null if in thread

**Relationships**:
- Created by **User**
- Optionally in **Thread** or **Guild** feed
- Has many **Reactions**
- Can have **Tags**

**Business Rules**:
- Must have either `threadId` or `guildId`
- AI highlights are auto-generated weekly
- Content supports Markdown

### Reaction

**Purpose**: Express sentiment on posts (implements Social Proof strategy).

**Types**:
- LIKE 👍
- LOVE ❤️
- INSIGHTFUL 💡
- ROCKET 🚀
- EYES 👀

**Relationships**:
- User reacts to Post

**Business Rules**:
- User can only react once per post per type
- Multiple reaction types allowed

### Quest

**Purpose**: Challenges/tasks for guild members with point rewards (implements Curiosity and Loss Aversion strategies).

**Key Fields**:
- `title`, `description`: Quest details
- `points`: Reward for completion
- `status`: DRAFT, ACTIVE, COMPLETED, ARCHIVED
- `deadline`: Creates urgency (Loss Aversion)
- `isTemplate`: Reusable quest templates

**Relationships**:
- Belongs to **Guild**
- Created by **User**
- Has many **QuestSubmissions**
- Can have **Tags**

**Business Rules**:
- Only active quests accept submissions
- Deadline enforces time pressure
- Points awarded upon approval
- Templates can be cloned for recurring quests

### QuestSubmission

**Purpose**: Member's submission for a quest.

**Key Fields**:
- `content`: Submission work (text, links, etc.)
- `status`: PENDING, APPROVED, REJECTED, NEEDS_REVISION
- `feedback`: Reviewer's comments
- `pointsAwarded`: Actual points given (may differ from quest points)
- `reviewedAt`: When reviewed

**Relationships**:
- User submits to Quest

**Business Rules**:
- One submission per user per quest
- Only admins/elders can review
- Points added to user's guild membership upon approval

## Phase 3 Entities

### Notification

**Purpose**: Inform users of important events (mentions, replies, quest updates).

**Types**:
- MENTION: Tagged in a post
- REPLY: Someone replied to your post/thread
- REACTION: Your post received reactions
- QUEST_ASSIGNED: New quest for you
- QUEST_APPROVED: Your submission approved
- QUEST_REJECTED: Your submission rejected
- MEMBER_JOINED: New member joined guild
- SYSTEM_ALERT: Platform announcements

**Key Fields**:
- `title`, `message`: Notification content
- `isRead`: Track read status
- `resourceType`, `resourceId`: Link to relevant resource
- `data`: Additional context (JSON)
- `actorId`: Who triggered this notification

**Relationships**:
- Sent to **User** (recipient)
- Optional **User** actor (who triggered it)

**Business Rules**:
- Unread notifications highlighted in UI
- Can be marked as read individually or in bulk
- Old notifications auto-archived after 30 days

### Activity

**Purpose**: Centralized activity log for feeds and analytics.

**Types**:
- GUILD_CREATED, GUILD_JOINED
- POST_CREATED, THREAD_CREATED
- QUEST_CREATED, QUEST_SUBMITTED, QUEST_COMPLETED
- REACTION_ADDED, MEMBER_PROMOTED

**Key Fields**:
- `type`: Activity type enum
- `description`: Human-readable description
- `resourceType`, `resourceId`: Link to relevant resource
- `metadata`: Additional context (JSON)

**Relationships**:
- Performed by **User**
- Optionally in **Guild** context

**Business Rules**:
- Immutable (activities never edited/deleted)
- Used for activity feeds and analytics
- Can be filtered by user, guild, type

### Tag

**Purpose**: Categorize and organize content for discovery.

**Key Fields**:
- `name`, `slug`: Tag identity
- `description`: Explain tag purpose
- `color`: Visual distinction

**Relationships**:
- Applied to Posts, Threads, Quests via **TagRelation**

**Business Rules**:
- Slug must be unique
- Tags are guild-agnostic (can be reused)
- Suggested based on content (future: AI-powered tagging)

### TagRelation

**Purpose**: Polymorphic relation connecting tags to various resources.

**Key Fields**:
- `resourceType`: "post", "thread", or "quest"
- `resourceId`: ID of the resource
- `tagId`: Tag being applied

**Relationships**:
- Links **Tag** to **Post**/**Thread**/**Quest**

**Business Rules**:
- Same tag cannot be applied twice to same resource
- Tags can be added/removed by content author or admins

### Integration

**Purpose**: Connect guild to external services (Discord, Slack, Zapier, webhooks).

**Types**:
- DISCORD_WEBHOOK: Post updates to Discord channel
- SLACK_WEBHOOK: Post updates to Slack channel
- ZAPIER: Trigger Zapier workflows
- CUSTOM_WEBHOOK: Generic webhook for any service

**Key Fields**:
- `type`: Integration type enum
- `name`: User-friendly name
- `isEnabled`: Toggle on/off
- `config`: JSON with webhook URL, API keys, etc.
- `eventFilters`: Which events trigger this integration

**Relationships**:
- Belongs to **Guild**

**Business Rules**:
- Only admins can manage integrations
- Failed webhooks logged but don't block operations
- Config is encrypted in database

### GuildMetric

**Purpose**: Daily metrics snapshot for guild analytics.

**Key Fields**:
- `date`: The date for this metric snapshot
- `totalMembers`, `activeMembers`, `newMembers`: Member metrics
- `postsCreated`, `threadsCreated`, `reactionsGiven`: Content metrics
- `questsCompleted`, `questsCreated`, `pointsAwarded`: Quest metrics
- `engagementScore`: Computed score (0-100)
- `metadata`: Additional custom metrics (JSON)

**Relationships**:
- Belongs to **Guild**

**Business Rules**:
- One record per guild per date (unique constraint)
- Computed daily via background job or CLI
- Used for analytics dashboard and charts
- Engagement score formula: `(activeMembers / totalMembers) * 50 + (postsCreated * 2) + (questsCompleted * 5)`

## Domain Patterns

### BPES Strategy Implementation

**Scarcity (希少性)**:
- Invite-only guilds with unique codes
- Limited role badges (ADMIN, ELDER)
- Point rankings showing top contributors
- Time-limited quests

**Curiosity (好奇心)**:
- AI-generated weekly highlights
- New quests appear regularly
- Thread summaries with one click
- Discovery through tags

**Loss Aversion (損失回避)**:
- Quest deadlines create urgency
- Point rankings show who's ahead
- Streak tracking (future)
- "Last chance" notifications

**Social Proof (社会的証明)**:
- Member counts visible
- Reaction counts on posts
- Activity feed showing engagement
- Top contributors highlighted

### Event-Driven Architecture

All major domain actions emit events:
- **GuildCreatedEvent** → Create activity, notify integrations
- **PostCreatedEvent** → Create activity, trigger notifications, track analytics
- **QuestCompletedEvent** → Award points, create activity, send notification

Events allow:
- Loose coupling between features
- Easy addition of new side effects
- Testing without mocks
- Audit trail

### Polymorphic Relations

**TagRelation** is polymorphic:
- Can link to Post, Thread, or Quest
- `resourceType` field specifies which
- Allows flexible tagging system

### JSON Fields for Flexibility

- `User.preferences`: UI theme, notification settings, etc.
- `Guild.settings`: Custom features, permissions, theme
- `Post.metadata`: Polls, attachments, embeds
- `Notification.data`: Additional context
- `Activity.metadata`: Event-specific data
- `Integration.config`: Service-specific configuration

Benefits:
- Schema flexibility without migrations
- Store unstructured data
- Easy to add new fields
- Type-safe with Prisma's Json type

## Business Workflows

### Create Guild

```
1. User fills form (name, description)
2. Server validates and creates Guild
3. User automatically becomes ADMIN
4. Default channels created (general, announcements)
5. GuildCreatedEvent emitted
6. Activity recorded
7. User redirected to guild feed
```

### Join Guild

```
1. User enters invite code
2. Server validates code
3. Membership created with MEMBER role
4. GuildJoinedEvent emitted
5. Activity recorded
6. Notification sent to guild admins
7. User redirected to guild feed
```

### Complete Quest

```
1. User submits work
2. QuestSubmission created with PENDING status
3. QuestSubmittedEvent emitted
4. Notification sent to guild admins
5. Admin reviews submission
6. If approved:
   - Points awarded to user's membership
   - User's totalPoints incremented
   - QuestCompletedEvent emitted
   - Activity recorded
   - Notification sent to user
```

### Generate Weekly Highlights

```
1. Scheduled job or manual trigger
2. Fetch posts from last 7 days
3. Send to OpenAI for summarization
4. Create Post with isAiHighlight=true
5. Pin the post
6. Create activity
7. Optionally notify all members
```

## Data Integrity

### Cascade Deletes

- Delete User → Deletes all their Memberships, Posts, Reactions
- Delete Guild → Deletes all Memberships, Channels, Quests, Posts
- Delete Thread → Deletes all Posts in thread
- Delete Quest → Deletes all QuestSubmissions

### Constraints

- Unique: `User.email`, `Guild.slug`, `Guild.inviteCode`
- Unique composite: `Membership(userId, guildId)`, `QuestSubmission(userId, questId)`
- Indexes on: All foreign keys, frequently queried fields (createdAt, status, role)

### Validation

- All inputs validated with Zod schemas in tRPC
- Prisma enforces database-level constraints
- Business rules enforced in service layer

## Future Enhancements

1. **Organization**: Multi-guild organizations with shared billing
2. **Thread Replies**: Nested comments (currently flat)
3. **Mentions**: @username parsing and linking
4. **Polls**: Built-in poll functionality in posts
5. **Files**: Attachment support with storage integration
6. **Search**: Full-text search across all content
7. **Moderation Queue**: Report/flag system with review workflow
8. **Webhooks**: Outbound webhooks for guild events
9. **API Keys**: Programmatic access for integrations
10. **Audit Log**: Complete history of all actions
