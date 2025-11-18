"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { formatDistanceToNow } from "~/lib/utils";

export default function GuildFeedPage() {
  const params = useParams();
  const guildSlug = params.guildSlug as string;
  const [newPostContent, setNewPostContent] = useState("");

  const { data: guild } = api.guild.getBySlug.useQuery({ slug: guildSlug });
  const { data: feedData } = api.guild.getFeed.useQuery(
    { guildId: guild?.id ?? "", limit: 20 },
    { enabled: !!guild?.id }
  );

  const utils = api.useUtils();
  const createPost = api.post.create.useMutation({
    onSuccess: () => {
      setNewPostContent("");
      void utils.guild.getFeed.invalidate();
    },
  });

  const handleSubmitPost = () => {
    if (!guild || !newPostContent.trim()) return;
    createPost.mutate({
      guildId: guild.id,
      content: newPostContent,
    });
  };

  if (!guild) return <div className="p-8 text-gray-300">読み込み中...</div>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold text-white">タイムライン</h1>

      {/* New Post Form */}
      <div className="mb-6 rounded-lg bg-guild-dark p-4">
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="何か投稿する..."
          className="mb-3 w-full resize-none rounded bg-guild-darker p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-guild-primary"
          rows={3}
        />
        <button
          onClick={handleSubmitPost}
          disabled={!newPostContent.trim() || createPost.isPending}
          className="rounded bg-guild-primary px-4 py-2 text-white hover:bg-guild-secondary disabled:opacity-50"
        >
          {createPost.isPending ? "投稿中..." : "投稿"}
        </button>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {feedData?.posts.map((post) => (
          <div
            key={post.id}
            className={`rounded-lg bg-guild-dark p-4 ${post.isPinned ? "border-2 border-guild-accent" : ""}`}
          >
            {post.isPinned && (
              <div className="mb-2 text-xs font-semibold uppercase text-guild-accent">
                📌 ピン留め {post.isAiHighlight && "• 🤖 AI生成"}
              </div>
            )}
            <div className="mb-3 flex items-start gap-3">
              {post.author.image ? (
                <img
                  src={post.author.image}
                  alt={post.author.name ?? ""}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-guild-primary text-white">
                  {post.author.name?.charAt(0) ?? "?"}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    {post.author.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(post.createdAt)}
                  </span>
                </div>
                {post.thread && (
                  <div className="text-xs text-gray-400">
                    in {post.thread.channel.slug} / {post.thread.title}
                  </div>
                )}
              </div>
            </div>

            <div className="prose prose-sm mb-3 whitespace-pre-wrap text-gray-200">
              {post.content}
            </div>

            {/* Reactions */}
            <div className="flex gap-2">
              {Object.entries(
                post.reactions.reduce(
                  (acc, r) => {
                    acc[r.type] = (acc[r.type] ?? 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>
                )
              ).map(([type, count]) => (
                <span
                  key={type}
                  className="rounded-full bg-guild-darker px-2 py-1 text-xs text-gray-300"
                >
                  {getReactionEmoji(type)} {count}
                </span>
              ))}
            </div>
          </div>
        ))}

        {(!feedData?.posts || feedData.posts.length === 0) && (
          <div className="rounded-lg bg-guild-dark p-12 text-center text-gray-400">
            まだ投稿がありません。最初の投稿をしてみましょう！
          </div>
        )}
      </div>
    </div>
  );
}

function getReactionEmoji(type: string): string {
  const emojis: Record<string, string> = {
    LIKE: "👍",
    LOVE: "❤️",
    INSIGHTFUL: "💡",
    ROCKET: "🚀",
    EYES: "👀",
  };
  return emojis[type] ?? "👍";
}
