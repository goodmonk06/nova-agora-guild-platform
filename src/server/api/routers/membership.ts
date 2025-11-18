import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { MemberRole } from "@prisma/client";

export const membershipRouter = createTRPCRouter({
  // Get all members of a guild
  getGuildMembers: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.membership.findMany({
        where: { guildId: input.guildId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              bio: true,
            },
          },
        },
        orderBy: [
          { role: "asc" },
          { points: "desc" },
        ],
      });
    }),

  // Update member role (admin only)
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        userId: z.string(),
        role: z.nativeEnum(MemberRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if requester is admin
      const requesterMembership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: input.guildId,
          },
        },
      });

      if (!requesterMembership || requesterMembership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update member roles",
        });
      }

      // Don't allow changing your own role
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change your own role",
        });
      }

      return ctx.db.membership.update({
        where: {
          userId_guildId: {
            userId: input.userId,
            guildId: input.guildId,
          },
        },
        data: {
          role: input.role,
        },
      });
    }),

  // Update member introduction
  updateIntro: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        intro: z.string().max(500),
        expertise: z.array(z.string()).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.membership.update({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: input.guildId,
          },
        },
        data: {
          intro: input.intro,
          expertise: input.expertise,
        },
      });
    }),

  // Get member profile in a guild
  getMemberProfile: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: input.userId,
            guildId: input.guildId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              bio: true,
              website: true,
              twitter: true,
            },
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      // Get member's recent posts in this guild
      const recentPosts = await ctx.db.post.findMany({
        where: {
          authorId: input.userId,
          guildId: input.guildId,
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          reactions: true,
        },
      });

      // Get member's quest submissions
      const questSubmissions = await ctx.db.questSubmission.findMany({
        where: {
          userId: input.userId,
          quest: {
            guildId: input.guildId,
          },
        },
        include: {
          quest: {
            select: {
              title: true,
            },
          },
        },
      });

      return {
        membership,
        recentPosts,
        questSubmissions,
      };
    }),

  // Award points to member (admin/elder only)
  awardPoints: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        userId: z.string(),
        points: z.number().int().positive(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if requester has permission
      const requesterMembership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: input.guildId,
          },
        },
      });

      if (
        !requesterMembership ||
        (requesterMembership.role !== "ADMIN" &&
          requesterMembership.role !== "ELDER")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and elders can award points",
        });
      }

      // Update membership points
      const membership = await ctx.db.membership.update({
        where: {
          userId_guildId: {
            userId: input.userId,
            guildId: input.guildId,
          },
        },
        data: {
          points: {
            increment: input.points,
          },
        },
      });

      // Also update user's total points
      await ctx.db.user.update({
        where: { id: input.userId },
        data: {
          totalPoints: {
            increment: input.points,
          },
        },
      });

      return membership;
    }),

  // Leave guild
  leaveGuild: protectedProcedure
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

      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Not a member of this guild",
        });
      }

      // Don't allow the last admin to leave
      if (membership.role === "ADMIN") {
        const adminCount = await ctx.db.membership.count({
          where: {
            guildId: input.guildId,
            role: "ADMIN",
          },
        });

        if (adminCount === 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot leave: you are the last admin. Transfer ownership first.",
          });
        }
      }

      await ctx.db.membership.delete({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: input.guildId,
          },
        },
      });

      return { success: true };
    }),
});
