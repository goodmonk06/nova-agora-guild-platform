import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { ReactionType } from "@prisma/client";

export const reactionRouter = createTRPCRouter({
  // Add or remove reaction (toggle)
  toggle: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        type: z.nativeEnum(ReactionType),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if reaction already exists
      const existing = await ctx.db.reaction.findUnique({
        where: {
          userId_postId_type: {
            userId: ctx.session.user.id,
            postId: input.postId,
            type: input.type,
          },
        },
      });

      if (existing) {
        // Remove reaction
        await ctx.db.reaction.delete({
          where: {
            id: existing.id,
          },
        });

        return { action: "removed", reaction: null };
      } else {
        // Add reaction
        const reaction = await ctx.db.reaction.create({
          data: {
            userId: ctx.session.user.id,
            postId: input.postId,
            type: input.type,
          },
        });

        return { action: "added", reaction };
      }
    }),

  // Get reactions for a post
  getForPost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const reactions = await ctx.db.reaction.findMany({
        where: { postId: input.postId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      // Group by type
      const grouped = reactions.reduce(
        (acc, reaction) => {
          if (!acc[reaction.type]) {
            acc[reaction.type] = [];
          }
          acc[reaction.type]!.push(reaction);
          return acc;
        },
        {} as Record<ReactionType, typeof reactions>
      );

      return grouped;
    }),
});
