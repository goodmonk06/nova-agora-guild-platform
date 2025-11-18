# Architecture Overview

## System Architecture

Nova Agora follows a **modern full-stack architecture** built with the T3 Stack, emphasizing type safety, developer experience, and extensibility.

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  Next.js 15 (App Router) + React 18 + Tailwind CSS         │
│  • Server Components for initial load                        │
│  • Client Components for interactivity                       │
│  • tRPC React hooks for type-safe API calls                 │
└─────────────┬───────────────────────────────────────────────┘
              │
              │ HTTP/tRPC
              │
┌─────────────▼───────────────────────────────────────────────┐
│                      API Layer                               │
│  tRPC Routers (Type-safe API endpoints)                     │
│  • Guild router (create, join, feed)                        │
│  • Post router (create, edit, delete, AI features)          │
│  • Quest router (CRUD, submissions, reviews)                │
│  • Notification, Activity, Analytics routers                │
└─────────────┬───────────────────────────────────────────────┘
              │
              │
┌─────────────▼───────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  • Domain Services                                           │
│  • Event Handlers (notifications, analytics, integrations)  │
│  • Adapter Interfaces (storage, email, webhooks)           │
└─────────────┬───────────────────────────────────────────────┘
              │
              │
┌─────────────▼───────────────────────────────────────────────┐
│                   Data Layer                                 │
│  Prisma ORM + PostgreSQL                                    │
│  • Type-safe database client                                │
│  • Migrations and seed scripts                              │
│  • Connection pooling                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  • OpenAI (AI curation)                                     │
│  • Redis (caching, sessions)                                │
│  • Email/SMS providers (notifications)                      │
│  • Storage (S3/R2 for file uploads)                         │
│  • Analytics (Mixpanel, Google Analytics)                   │
└─────────────────────────────────────────────────────────────┘
```

## Layers and Responsibilities

### 1. Presentation Layer (`src/app`)

**Responsibilities**:
- Render UI components
- Handle user interactions
- Client-side state management
- Server-side rendering for initial load

**Key Patterns**:
- **Server Components**: Default for all pages, fetch data server-side
- **Client Components**: Only when needed for interactivity (forms, real-time updates)
- **Layouts**: Shared layout logic (sidebar, navigation)
- **Route Groups**: Organize authenticated vs public routes

**Structure**:
```
src/app/
├── (authenticated)/        # Protected routes
│   ├── dashboard/          # User dashboard
│   ├── guild/              # Guild creation and joining
│   └── g/[guildSlug]/      # Guild-specific pages
├── auth/                   # Authentication pages
├── api/                    # API route handlers
│   ├── auth/               # NextAuth endpoints
│   └── trpc/               # tRPC handler
├── layout.tsx              # Root layout
└── page.tsx                # Landing page
```

### 2. API Layer (`src/server/api`)

**Responsibilities**:
- Expose type-safe API endpoints
- Input validation (Zod schemas)
- Authentication and authorization
- Error handling

**Key Patterns**:
- **tRPC routers**: Type-safe RPC-style APIs
- **Procedures**: Query (read) vs Mutation (write)
- **Middleware**: Authentication, logging, error handling
- **Context**: Request-scoped data (session, db, etc.)

**Structure**:
```
src/server/api/
├── routers/
│   ├── guild.ts            # Guild operations
│   ├── post.ts             # Post CRUD + AI features
│   ├── quest.ts            # Quest system
│   ├── notification.ts     # Notifications
│   └── activity.ts         # Activity feed
├── root.ts                 # Main router (aggregates all routers)
└── trpc.ts                 # tRPC configuration
```

### 3. Business Logic Layer (`src/lib`, `src/server/services`)

**Responsibilities**:
- Core domain logic
- Integration with external services
- Event handling and side effects
- Adapter pattern for extensibility

**Key Patterns**:
- **Services**: Encapsulate complex business logic (AI, analytics)
- **Adapters**: Interface-based integration points (storage, notifications)
- **Events**: Domain events for cross-cutting concerns
- **Logger/Metrics**: Observability

**Structure**:
```
src/lib/
├── adapters/               # Extensibility layer
│   ├── notification.ts     # Notification providers
│   ├── storage.ts          # File storage providers
│   └── analytics.ts        # Analytics providers
├── events/                 # Domain events
│   ├── types.ts            # Event type definitions
│   └── bus.ts              # Event bus implementation
├── logger.ts               # Structured logging
├── metrics.ts              # Metrics collection
└── utils.ts                # Utility functions

src/server/services/
└── openai.ts               # AI service (OpenAI integration)
```

### 4. Data Layer (`prisma`)

**Responsibilities**:
- Database schema definition
- Type-safe database access
- Migrations and seeding
- Relationships and constraints

**Key Patterns**:
- **Schema-first**: Prisma schema is source of truth
- **Migrations**: Version-controlled schema changes
- **Seeding**: Reproducible demo data

**Structure**:
```
prisma/
├── schema.prisma           # Database schema (14 models)
└── seed.ts                 # Seed script
```

## Cross-Cutting Concerns

### Authentication & Authorization

**Implementation**:
- **NextAuth.js**: Handles authentication flows
- **Providers**: Email magic link, Discord OAuth
- **Session**: Stored in database
- **Middleware**: `protectedProcedure` in tRPC

**Authorization Levels**:
1. **Public**: Anyone can access (landing page)
2. **Authenticated**: Requires login (dashboard)
3. **Guild Member**: Must be member of guild
4. **Guild Elder/Admin**: Elevated permissions within guild

### Error Handling

**Strategy**:
- **tRPC**: Centralized error handling with typed errors
- **Error codes**: HTTP-like codes (UNAUTHORIZED, NOT_FOUND, etc.)
- **Zod validation**: Input validation with detailed error messages
- **Logger**: All errors logged with context

### Observability

**Components**:
1. **Logging** (`lib/logger.ts`):
   - Structured logs with context
   - Different log levels (debug, info, warn, error)
   - Production-ready JSON format

2. **Metrics** (`lib/metrics.ts`):
   - Counters, gauges, histograms
   - Performance timing
   - Business metrics (guilds created, posts published)

3. **Tracing** (future):
   - OpenTelemetry integration planned
   - Distributed tracing for debugging

### Extensibility

**Design Principle**: Plugin architecture with adapters

**Adapter Interfaces**:
1. **INotificationProvider**: Email, push, SMS, webhooks
2. **IStorageProvider**: S3, R2, local filesystem
3. **IAnalyticsProvider**: Internal, Google Analytics, Mixpanel

**Event System**:
- **Domain Events**: Typed events for all major actions
- **Event Bus**: In-memory pub/sub (upgradable to Redis/RabbitMQ)
- **Handlers**: Loosely coupled side effects (notifications, analytics)

**Benefits**:
- Easy to swap implementations
- Test with mock providers
- Add new integrations without changing core logic

## Data Flow Examples

### Example 1: Create a Post

```
User submits form
    ↓
Client Component calls tRPC mutation
    ↓
tRPC Router validates input (Zod)
    ↓
Checks authorization (protectedProcedure)
    ↓
Creates post in database (Prisma)
    ↓
Emits PostCreatedEvent
    ↓
Event handlers:
    • Create Activity record
    • Send notifications to mentioned users
    • Track analytics
    ↓
Returns post data to client
    ↓
Client updates UI optimistically
```

### Example 2: Join a Guild

```
User enters invite code
    ↓
Client calls guild.joinByInvite mutation
    ↓
Server validates invite code
    ↓
Creates Membership record
    ↓
Emits GuildJoinedEvent
    ↓
Event handlers:
    • Create Activity
    • Notify guild admins
    • Track analytics
    ↓
Returns guild data
    ↓
Redirect user to guild feed
```

## Deployment Architecture

### Development

```
docker-compose.dev.yml:
  • PostgreSQL (persistent)
  • Redis (ephemeral)

Host machine:
  • Next.js dev server (npm run dev)
  • Hot reload enabled
```

### Production

```
docker-compose.yml:
  • App container (Next.js standalone)
  • PostgreSQL container
  • Redis container
  • Nginx (optional, reverse proxy)

OR

Vercel/Railway/Fly.io:
  • App deployed to platform
  • PostgreSQL from Neon/Supabase
  • Redis from Upstash
```

## Performance Considerations

### Database

- **Indexes**: All foreign keys and frequently queried fields indexed
- **Connection pooling**: Prisma connection pool configured
- **Query optimization**: Eager loading with `include` to avoid N+1

### Caching

- **Redis**: Optional but recommended for production
- **Cache keys**: Structured (e.g., `guild:{id}:feed`)
- **Invalidation**: Event-driven cache invalidation

### API

- **tRPC batching**: Multiple queries batched into single request
- **Pagination**: Cursor-based pagination for feeds
- **Rate limiting**: (TODO) Per-user rate limits

### Frontend

- **Server Components**: Reduce client-side JavaScript
- **Code splitting**: Automatic route-based splitting
- **Image optimization**: Next.js Image component
- **Bundle analysis**: Regular bundle size monitoring

## Security

### Authentication

- **Secure tokens**: NextAuth handles token generation securely
- **HttpOnly cookies**: Session cookies not accessible to JavaScript
- **CSRF protection**: Built into Next.js

### Authorization

- **Row-level security**: Prisma queries filtered by user/guild membership
- **Role-based access**: Admin/Elder/Member roles enforced
- **Input validation**: All inputs validated with Zod

### Data Protection

- **SQL injection**: Prisma prevents SQL injection
- **XSS**: React escapes by default
- **Secret management**: Environment variables for all secrets
- **HTTPS**: Required in production

## Scalability

### Current Limits

- **Single server**: Handles ~1000 concurrent users
- **Single database**: Can scale vertically
- **No caching**: All queries hit database

### Future Scaling

1. **Horizontal scaling**: Multiple app instances behind load balancer
2. **Database read replicas**: Read queries to replicas
3. **Redis caching**: Cache hot data (guild info, user profiles)
4. **CDN**: Static assets and images on CDN
5. **Message queue**: Async processing for heavy tasks (AI, emails)

## Development Workflow

```
1. Feature branch: git checkout -b feature/xyz
2. Schema changes: Edit prisma/schema.prisma
3. Generate client: npm run db:push
4. Implement logic: Add routers, pages, etc.
5. Add tests: Write tests for new features
6. Run tests: npm test
7. Lint/format: npm run lint
8. Commit: git commit -m "feat: xyz"
9. Push: git push
10. PR: Create pull request for review
```

## Future Architecture Enhancements

1. **Microservices**: Extract heavy services (AI, analytics) into separate services
2. **GraphQL**: Optional GraphQL layer for mobile apps
3. **WebSockets**: Real-time updates for chat, notifications
4. **Event sourcing**: Audit log with event sourcing pattern
5. **Multi-tenancy**: Organization accounts with multiple guilds
6. **Search**: Elasticsearch for full-text search
7. **CDN**: CloudFlare/Fastly for global content delivery
