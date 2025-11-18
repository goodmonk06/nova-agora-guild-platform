"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { api } from "~/trpc/react";

export default function GuildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const guildSlug = params.guildSlug as string;

  const { data: guild } = api.guild.getBySlug.useQuery({ slug: guildSlug });
  const { data: channels } = api.channel.getGuildChannels.useQuery(
    { guildId: guild?.id ?? "" },
    { enabled: !!guild?.id }
  );
  const { data: members } = api.membership.getGuildMembers.useQuery(
    { guildId: guild?.id ?? "" },
    { enabled: !!guild?.id }
  );
  const { data: activeQuests } = api.quest.getActiveQuests.useQuery(
    { guildId: guild?.id ?? "" },
    { enabled: !!guild?.id }
  );

  if (!guild) {
    return (
      <div className="flex h-screen items-center justify-center bg-guild-darker">
        <div className="text-center">
          <div className="mb-4 text-xl text-gray-300">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-guild-darker">
      {/* Left Sidebar - Guilds & Channels */}
      <div className="w-64 flex-shrink-0 border-r border-gray-800 bg-guild-dark">
        <div className="p-4">
          <Link
            href="/dashboard"
            className="mb-4 block text-sm text-gray-400 hover:text-white"
          >
            ← ダッシュボード
          </Link>
          <h2 className="mb-4 text-xl font-bold text-white">{guild.name}</h2>

          <div className="mb-6">
            <Link
              href={`/g/${guildSlug}/feed`}
              className={`block rounded px-3 py-2 text-sm ${
                pathname === `/g/${guildSlug}/feed`
                  ? "bg-guild-primary text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              📰 タイムライン
            </Link>
            <Link
              href={`/g/${guildSlug}/quests`}
              className={`block rounded px-3 py-2 text-sm ${
                pathname === `/g/${guildSlug}/quests`
                  ? "bg-guild-primary text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              ⚔️ クエスト
            </Link>
          </div>

          <div className="mb-2 text-xs font-semibold uppercase text-gray-500">
            チャンネル
          </div>
          <div className="space-y-1">
            {channels?.map((channel) => (
              <Link
                key={channel.id}
                href={`/g/${guildSlug}/c/${channel.slug}`}
                className={`block rounded px-3 py-2 text-sm ${
                  pathname.includes(`/c/${channel.slug}`)
                    ? "bg-guild-primary text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                # {channel.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* Right Sidebar - Members & Quests */}
      <div className="w-72 flex-shrink-0 border-l border-gray-800 bg-guild-dark p-4">
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">
            今週のクエスト
          </h3>
          {activeQuests && activeQuests.length > 0 ? (
            <div className="space-y-2">
              {activeQuests.map((quest) => (
                <Link
                  key={quest.id}
                  href={`/g/${guildSlug}/quests/${quest.id}`}
                  className="block rounded-lg bg-guild-darker p-3 hover:bg-gray-800"
                >
                  <div className="mb-1 text-sm font-medium text-white">
                    {quest.title}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{quest.points} ポイント</span>
                    {quest.submissions[0] && (
                      <span className="rounded-full bg-guild-primary px-2 py-0.5 text-white">
                        {quest.submissions[0].status === "APPROVED"
                          ? "完了"
                          : "提出済み"}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              現在アクティブなクエストはありません
            </p>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">
            メンバー ({members?.length ?? 0})
          </h3>
          <div className="space-y-2">
            {members?.slice(0, 10).map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 rounded p-2 hover:bg-guild-darker"
              >
                {member.user.image ? (
                  <img
                    src={member.user.image}
                    alt={member.user.name ?? ""}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-guild-primary text-xs text-white">
                    {member.user.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <div className="truncate text-sm text-white">
                    {member.user.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {member.points} pts
                  </div>
                </div>
                {member.role !== "MEMBER" && (
                  <span className="text-xs text-guild-accent">
                    {member.role === "ADMIN" ? "👑" : "⭐"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
