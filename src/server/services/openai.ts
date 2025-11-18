import OpenAI from "openai";
import { env } from "~/env";

const createOpenAIClient = () => {
  if (!env.OPENAI_API_KEY) {
    console.warn("OpenAI API key not configured");
    return null;
  }
  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
};

const openai = createOpenAIClient();

export const aiService = {
  /**
   * Generate weekly highlights from posts
   */
  async generateWeeklyHighlights(posts: Array<{ content: string; author: { name: string | null } }>) {
    if (!openai) {
      throw new Error("OpenAI is not configured");
    }

    const postsText = posts
      .map((p, i) => `Post ${i + 1} by ${p.author.name ?? "Anonymous"}:\n${p.content}`)
      .join("\n\n---\n\n");

    const prompt = `以下は今週のギルドでの投稿です。これらを分析して、魅力的な「今週のハイライト」を日本語で生成してください。

投稿:
${postsText}

以下の形式で出力してください:
# 今週のハイライト 🌟

## 主要なトピック
- [トピック1]
- [トピック2]
- [トピック3]

## 注目の議論
[簡潔な要約]

## 今週の名言
> [印象的な投稿からの引用]

## 来週への期待
[コミュニティへの前向きなメッセージ]
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたはコミュニティマネージャーとして、メンバーを励まし、エンゲージメントを高める役割を担っています。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content ?? "ハイライトを生成できませんでした。";
  },

  /**
   * Summarize a long thread
   */
  async summarizeThread(posts: Array<{ content: string; author: { name: string | null } }>) {
    if (!openai) {
      throw new Error("OpenAI is not configured");
    }

    const postsText = posts
      .map((p, i) => `${p.author.name ?? "Anonymous"}: ${p.content}`)
      .join("\n\n");

    const prompt = `以下のスレッドの会話を要約してください。主要なポイント、結論、アクションアイテムがあれば含めてください。

会話:
${postsText}

簡潔で分かりやすい日本語の要約を提供してください。`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたは会話を簡潔に要約する専門家です。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content ?? "要約を生成できませんでした。";
  },

  /**
   * Generate quest ideas based on guild activity
   */
  async generateQuestIdeas(guildContext: {
    name: string;
    description: string | null;
    recentTopics: string[];
  }) {
    if (!openai) {
      throw new Error("OpenAI is not configured");
    }

    const prompt = `ギルド「${guildContext.name}」のための新しいクエストのアイデアを3つ提案してください。

ギルドについて:
${guildContext.description ?? "説明なし"}

最近の話題:
${guildContext.recentTopics.join(", ")}

各クエストには以下を含めてください:
1. タイトル
2. 説明
3. 推奨ポイント報酬
4. 期待される成果物`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたはコミュニティのエンゲージメントを高めるクエストデザイナーです。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    return response.choices[0]?.message?.content ?? "クエストアイデアを生成できませんでした。";
  },
};
