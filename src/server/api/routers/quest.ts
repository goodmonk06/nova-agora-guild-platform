import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { QuestStatus, SubmissionStatus } from "@prisma/client";

export const questRouter = createTRPCRouter({
  // Get all quests for a guild
  getGuildQuests: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        status: z.nativeEnum(QuestStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.quest.findMany({
        where: {
          guildId: input.guildId,
          status: input.status,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: [
          { deadline: "asc" },
          { createdAt: "desc" },
        ],
      });
    }),

  // Get active quests (for right sidebar)
  getActiveQuests: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      return ctx.db.quest.findMany({
        where: {
          guildId: input.guildId,
          status: "ACTIVE",
          OR: [
            { deadline: null },
            { deadline: { gte: now } },
          ],
        },
        include: {
          _count: {
            select: {
              submissions: true,
            },
          },
          submissions: {
            where: {
              userId: ctx.session.user.id,
            },
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { deadline: "asc" },
        take: 5,
      });
    }),

  // Get quest details
  getById: protectedProcedure
    .input(z.object({ questId: z.string() }))
    .query(async ({ ctx, input }) => {
      const quest = await ctx.db.quest.findUnique({
        where: { id: input.questId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          guild: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          submissions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: { submittedAt: "desc" },
          },
        },
      });

      if (!quest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quest not found",
        });
      }

      return quest;
    }),

  // Create quest (admin/elder only)
  create: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        title: z.string().min(1).max(200),
        description: z.string().min(1),
        points: z.number().int().nonnegative(),
        deadline: z.date().optional(),
        status: z.nativeEnum(QuestStatus).default("DRAFT"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check permission
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: input.guildId,
          },
        },
      });

      if (
        !membership ||
        (membership.role !== "ADMIN" && membership.role !== "ELDER")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and elders can create quests",
        });
      }

      return ctx.db.quest.create({
        data: {
          ...input,
          creatorId: ctx.session.user.id,
        },
      });
    }),

  // Update quest (admin/elder only)
  update: protectedProcedure
    .input(
      z.object({
        questId: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().min(1).optional(),
        points: z.number().int().nonnegative().optional(),
        deadline: z.date().optional(),
        status: z.nativeEnum(QuestStatus).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quest = await ctx.db.quest.findUnique({
        where: { id: input.questId },
      });

      if (!quest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quest not found",
        });
      }

      // Check permission
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: quest.guildId,
          },
        },
      });

      if (
        !membership ||
        (membership.role !== "ADMIN" && membership.role !== "ELDER")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and elders can update quests",
        });
      }

      const { questId, ...updateData } = input;

      return ctx.db.quest.update({
        where: { id: questId },
        data: updateData,
      });
    }),

  // Submit quest
  submit: protectedProcedure
    .input(
      z.object({
        questId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quest = await ctx.db.quest.findUnique({
        where: { id: input.questId },
      });

      if (!quest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quest not found",
        });
      }

      if (quest.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quest is not active",
        });
      }

      // Check if deadline has passed
      if (quest.deadline && new Date() > quest.deadline) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quest deadline has passed",
        });
      }

      // Verify membership
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: quest.guildId,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a member of this guild",
        });
      }

      // Check if already submitted
      const existing = await ctx.db.questSubmission.findUnique({
        where: {
          userId_questId: {
            userId: ctx.session.user.id,
            questId: input.questId,
          },
        },
      });

      if (existing) {
        // Update existing submission
        return ctx.db.questSubmission.update({
          where: {
            userId_questId: {
              userId: ctx.session.user.id,
              questId: input.questId,
            },
          },
          data: {
            content: input.content,
            status: "PENDING",
            submittedAt: new Date(),
          },
        });
      }

      return ctx.db.questSubmission.create({
        data: {
          questId: input.questId,
          userId: ctx.session.user.id,
          content: input.content,
        },
      });
    }),

  // Review submission (admin/elder only)
  reviewSubmission: protectedProcedure
    .input(
      z.object({
        submissionId: z.string(),
        status: z.nativeEnum(SubmissionStatus),
        feedback: z.string().optional(),
        pointsAwarded: z.number().int().nonnegative().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.db.questSubmission.findUnique({
        where: { id: input.submissionId },
        include: {
          quest: true,
          user: true,
        },
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found",
        });
      }

      // Check permission
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: submission.quest.guildId,
          },
        },
      });

      if (
        !membership ||
        (membership.role !== "ADMIN" && membership.role !== "ELDER")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and elders can review submissions",
        });
      }

      // Update submission
      const updatedSubmission = await ctx.db.questSubmission.update({
        where: { id: input.submissionId },
        data: {
          status: input.status,
          feedback: input.feedback,
          pointsAwarded: input.pointsAwarded,
          reviewedAt: new Date(),
        },
      });

      // If approved, award points
      if (input.status === "APPROVED" && input.pointsAwarded) {
        // Update membership points
        await ctx.db.membership.update({
          where: {
            userId_guildId: {
              userId: submission.userId,
              guildId: submission.quest.guildId,
            },
          },
          data: {
            points: {
              increment: input.pointsAwarded,
            },
          },
        });

        // Update user's total points
        await ctx.db.user.update({
          where: { id: submission.userId },
          data: {
            totalPoints: {
              increment: input.pointsAwarded,
            },
          },
        });
      }

      return updatedSubmission;
    }),

  // Get my submissions for a guild
  getMySubmissions: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.questSubmission.findMany({
        where: {
          userId: ctx.session.user.id,
          quest: {
            guildId: input.guildId,
          },
        },
        include: {
          quest: {
            select: {
              id: true,
              title: true,
              points: true,
              deadline: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      });
    }),
});
