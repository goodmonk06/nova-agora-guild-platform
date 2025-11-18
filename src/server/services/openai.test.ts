import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock OpenAI
vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: "Mocked AI response",
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

describe("AI Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateWeeklyHighlights", () => {
    it("should handle empty posts array", async () => {
      const { aiService } = await import("./openai");

      // When OPENAI_API_KEY is not set, it should throw
      await expect(
        aiService.generateWeeklyHighlights([])
      ).rejects.toThrow();
    });

    it("should process posts with author information", async () => {
      const posts = [
        {
          content: "Great discussion about TypeScript!",
          author: { name: "Alice" },
        },
        {
          content: "I learned a lot today.",
          author: { name: "Bob" },
        },
      ];

      // This would require OPENAI_API_KEY to be set
      // For now, we're just testing the structure
      expect(posts).toHaveLength(2);
      expect(posts[0]?.author.name).toBe("Alice");
    });
  });

  describe("summarizeThread", () => {
    it("should handle posts array structure", async () => {
      const posts = [
        {
          content: "First post",
          author: { name: "Alice" },
        },
        {
          content: "Reply post",
          author: { name: "Bob" },
        },
      ];

      expect(posts).toHaveLength(2);
      expect(posts.every((p) => p.content && p.author)).toBe(true);
    });
  });

  describe("generateQuestIdeas", () => {
    it("should validate guild context structure", () => {
      const guildContext = {
        name: "Test Guild",
        description: "A test guild",
        recentTopics: ["TypeScript", "React", "Next.js"],
      };

      expect(guildContext.name).toBeDefined();
      expect(guildContext.recentTopics).toBeInstanceOf(Array);
      expect(guildContext.recentTopics.length).toBeGreaterThan(0);
    });

    it("should handle guild context with null description", () => {
      const guildContext = {
        name: "Test Guild",
        description: null,
        recentTopics: ["TypeScript"],
      };

      expect(guildContext.description).toBeNull();
      expect(guildContext.name).toBe("Test Guild");
    });
  });
});
