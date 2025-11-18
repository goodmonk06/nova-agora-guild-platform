import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const channelRouter = createTRPCRouter({
  // Get all channels in a guild
  getGuildChannels: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify membership
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

      return ctx.db.channel.findMany({
        where: { guildId: input.guildId },
        include: {
          _count: {
            select: {
              threads: true,
            },
          },
        },
        orderBy: { position: "asc" },
      });
    }),

  // Get channel by slug
  getBySlug: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        slug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const channel = await ctx.db.channel.findUnique({
        where: {
          guildId_slug: {
            guildId: input.guildId,
            slug: input.slug,
          },
        },
        include: {
          threads: {
            take: 20,
            orderBy: [
              { isPinned: "desc" },
              { updatedAt: "desc" },
            ],
            include: {
              posts: {
                take: 1,
                orderBy: { createdAt: "asc" },
                include: {
                  author: {
                    select: {
                      id: true,
                      name: true,
                      image: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  posts: true,
                },
              },
            },
          },
        },
      });

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      return channel;
    }),

  // Create channel (admin only)
  create: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        name: z.string().min(1).max(50),
        slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
        description: z.string().optional(),
        isPrivate: z.boolean().default(false),
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
          message: "Only admins can create channels",
        });
      }

      // Get max position
      const maxPosition = await ctx.db.channel.findFirst({
        where: { guildId: input.guildId },
        orderBy: { position: "desc" },
        select: { position: true },
      });

      return ctx.db.channel.create({
        data: {
          guildId: input.guildId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          isPrivate: input.isPrivate,
          position: (maxPosition?.position ?? -1) + 1,
        },
      });
    }),

  // Update channel (admin only)
  update: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        name: z.string().min(1).max(50).optional(),
        description: z.string().optional(),
        isPrivate: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const channel = await ctx.db.channel.findUnique({
        where: { id: input.channelId },
      });

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Check if user is admin
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: channel.guildId,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update channels",
        });
      }

      const { channelId, ...updateData } = input;

      return ctx.db.channel.update({
        where: { id: channelId },
        data: updateData,
      });
    }),

  // Delete channel (admin only)
  delete: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const channel = await ctx.db.channel.findUnique({
        where: { id: input.channelId },
      });

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Check if user is admin
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: channel.guildId,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete channels",
        });
      }

      await ctx.db.channel.delete({
        where: { id: input.channelId },
      });

      return { success: true };
    }),
});
