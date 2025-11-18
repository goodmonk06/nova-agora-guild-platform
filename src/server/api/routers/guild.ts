import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const guildRouter = createTRPCRouter({
  // Get all guilds the user is a member of
  getMyGuilds: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.guild.findMany({
      where: {
        memberships: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      include: {
        memberships: {
          where: {
            userId: ctx.session.user.id,
          },
          select: {
            role: true,
            points: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            channels: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }),

  // Get guild by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const guild = await ctx.db.guild.findUnique({
        where: { slug: input.slug },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          channels: {
            orderBy: { position: "asc" },
          },
          _count: {
            select: {
              memberships: true,
            },
          },
        },
      });

      if (!guild) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Guild not found",
        });
      }

      // Check if user is a member
      let membership = null;
      if (ctx.session?.user) {
        membership = await ctx.db.membership.findUnique({
          where: {
            userId_guildId: {
              userId: ctx.session.user.id,
              guildId: guild.id,
            },
          },
        });
      }

      return {
        ...guild,
        isMember: !!membership,
        memberRole: membership?.role,
      };
    }),

  // Create a new guild
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
        description: z.string().optional(),
        image: z.string().url().optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug is already taken
      const existing = await ctx.db.guild.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Guild slug is already taken",
        });
      }

      const guild = await ctx.db.guild.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          image: input.image,
          isPublic: input.isPublic,
          creatorId: ctx.session.user.id,
          memberships: {
            create: {
              userId: ctx.session.user.id,
              role: "ADMIN",
            },
          },
          channels: {
            create: [
              {
                name: "一般",
                slug: "general",
                description: "全般的な話題について",
                position: 0,
              },
              {
                name: "お知らせ",
                slug: "announcements",
                description: "重要なお知らせ",
                position: 1,
              },
            ],
          },
        },
        include: {
          channels: true,
        },
      });

      return guild;
    }),

  // Update guild
  update: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        image: z.string().url().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: input.guildId,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update guild settings",
        });
      }

      const { guildId, ...updateData } = input;

      return ctx.db.guild.update({
        where: { id: guildId },
        data: updateData,
      });
    }),

  // Join guild via invite code
  joinByInvite: protectedProcedure
    .input(z.object({ inviteCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const guild = await ctx.db.guild.findUnique({
        where: { inviteCode: input.inviteCode },
      });

      if (!guild) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invite code",
        });
      }

      // Check if already a member
      const existing = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: guild.id,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already a member of this guild",
        });
      }

      const membership = await ctx.db.membership.create({
        data: {
          userId: ctx.session.user.id,
          guildId: guild.id,
          role: "MEMBER",
        },
      });

      return { guild, membership };
    }),

  // Get guild feed (timeline)
  getFeed: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check membership
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: input.guildId,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a member of this guild",
        });
      }

      const posts = await ctx.db.post.findMany({
        where: { guildId: input.guildId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          thread: {
            select: {
              id: true,
              title: true,
              slug: true,
              channel: {
                select: {
                  slug: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (posts.length > input.limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        posts,
        nextCursor,
      };
    }),

  // Regenerate invite code (admin only)
  regenerateInviteCode: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: input.guildId,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can regenerate invite codes",
        });
      }

      const guild = await ctx.db.guild.update({
        where: { id: input.guildId },
        data: {
          inviteCode: Math.random().toString(36).substring(2, 15),
        },
      });

      return guild;
    }),
});
