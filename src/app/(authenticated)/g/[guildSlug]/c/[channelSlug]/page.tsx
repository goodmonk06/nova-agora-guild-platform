"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { formatDistanceToNow } from "~/lib/utils";

export default function ChannelPage() {
  const params = useParams();
  const guildSlug = params.guildSlug as string;
  const channelSlug = params.channelSlug as string;

  const { data: guild } = api.guild.getBySlug.useQuery({ slug: guildSlug });
  const { data: channel } = api.channel.getBySlug.useQuery(
    { guildId: guild?.id ?? "", slug: channelSlug },
    { enabled: !!guild?.id }
  );

  if (!channel) {
    return <div className="p-8 text-gray-300">読み込み中...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white"># {channel.name}</h1>
        {channel.description && (
          <p className="text-gray-400">{channel.description}</p>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">スレッド</h2>
        <Link
          href={`/g/${guildSlug}/c/${channelSlug}/new`}
          className="rounded bg-guild-primary px-4 py-2 text-sm text-white hover:bg-guild-secondary"
        >
          新しいスレッド
        </Link>
      </div>

      <div className="space-y-3">
        {channel.threads.map((thread) => (
          <Link
            key={thread.id}
            href={`/g/${guildSlug}/c/${channelSlug}/t/${thread.slug}`}
            className="block rounded-lg bg-guild-dark p-4 hover:bg-gray-800"
          >
            <div className="mb-2 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-white">
                {thread.isPinned && "📌 "}
                {thread.title}
              </h3>
              <span className="text-xs text-gray-500">
                {thread._count.posts} 投稿
              </span>
            </div>

            {thread.posts[0] && (
              <div className="mb-2 flex items-center gap-2">
                {thread.posts[0].author.image ? (
                  <img
                    src={thread.posts[0].author.image}
                    alt={thread.posts[0].author.name ?? ""}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-guild-primary text-xs text-white">
                    {thread.posts[0].author.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <span className="text-sm text-gray-400">
                  {thread.posts[0].author.name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(thread.posts[0].createdAt)}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{thread.viewCount} 閲覧</span>
              {thread.isLocked && <span>🔒 ロック済み</span>}
            </div>
          </Link>
        ))}

        {channel.threads.length === 0 && (
          <div className="rounded-lg bg-guild-dark p-12 text-center text-gray-400">
            まだスレッドがありません。最初のスレッドを作成しましょう！
          </div>
        )}
      </div>
    </div>
  );
}
