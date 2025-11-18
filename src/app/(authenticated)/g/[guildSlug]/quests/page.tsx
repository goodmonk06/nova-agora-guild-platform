"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function QuestsPage() {
  const params = useParams();
  const guildSlug = params.guildSlug as string;

  const { data: guild } = api.guild.getBySlug.useQuery({ slug: guildSlug });
  const { data: quests } = api.quest.getGuildQuests.useQuery(
    { guildId: guild?.id ?? "" },
    { enabled: !!guild?.id }
  );
  const { data: mySubmissions } = api.quest.getMySubmissions.useQuery(
    { guildId: guild?.id ?? "" },
    { enabled: !!guild?.id }
  );

  if (!guild) {
    return <div className="p-8 text-gray-300">読み込み中...</div>;
  }

  const activeQuests = quests?.filter((q) => q.status === "ACTIVE") ?? [];
  const draftQuests = quests?.filter((q) => q.status === "DRAFT") ?? [];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">クエスト</h1>
        <p className="text-gray-400">
          課題に挑戦してポイントを獲得しよう！
        </p>
      </div>

      {/* Active Quests */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          アクティブなクエスト
        </h2>
        {activeQuests.length > 0 ? (
          <div className="space-y-4">
            {activeQuests.map((quest) => {
              const submission = mySubmissions?.find(
                (s) => s.quest.id === quest.id
              );
              const isDeadlinePassed =
                quest.deadline && new Date(quest.deadline) < new Date();

              return (
                <div
                  key={quest.id}
                  className="rounded-lg bg-guild-dark p-6 hover:bg-gray-800"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 text-lg font-semibold text-white">
                        {quest.title}
                      </h3>
                      <p className="mb-2 text-sm text-gray-400">
                        {quest.description.substring(0, 150)}
                        {quest.description.length > 150 && "..."}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="mb-1 text-2xl font-bold text-guild-primary">
                        {quest.points}
                      </div>
                      <div className="text-xs text-gray-500">ポイント</div>
                    </div>
                  </div>

                  <div className="mb-3 flex items-center gap-4 text-sm text-gray-500">
                    <span>{quest._count.submissions} 件の提出</span>
                    {quest.deadline && (
                      <span
                        className={
                          isDeadlinePassed ? "text-red-400" : "text-gray-500"
                        }
                      >
                        期限:{" "}
                        {new Date(quest.deadline).toLocaleDateString("ja-JP")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {submission ? (
                      <>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            submission.status === "APPROVED"
                              ? "bg-green-900/30 text-green-300"
                              : submission.status === "REJECTED"
                                ? "bg-red-900/30 text-red-300"
                                : submission.status === "NEEDS_REVISION"
                                  ? "bg-yellow-900/30 text-yellow-300"
                                  : "bg-blue-900/30 text-blue-300"
                          }`}
                        >
                          {submission.status === "APPROVED"
                            ? "承認済み"
                            : submission.status === "REJECTED"
                              ? "却下"
                              : submission.status === "NEEDS_REVISION"
                                ? "要修正"
                                : "審査中"}
                        </span>
                        {submission.pointsAwarded && (
                          <span className="text-sm text-guild-primary">
                            +{submission.pointsAwarded} ポイント獲得
                          </span>
                        )}
                      </>
                    ) : (
                      <Link
                        href={`/g/${guildSlug}/quests/${quest.id}`}
                        className="rounded-md bg-guild-primary px-4 py-2 text-sm text-white hover:bg-guild-secondary"
                      >
                        詳細を見る
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg bg-guild-dark p-12 text-center text-gray-400">
            現在アクティブなクエストはありません
          </div>
        )}
      </div>

      {/* Draft Quests (for admins/elders) */}
      {guild.memberRole === "ADMIN" || guild.memberRole === "ELDER" ? (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">
            ドラフト（管理者のみ表示）
          </h2>
          {draftQuests.length > 0 ? (
            <div className="space-y-4">
              {draftQuests.map((quest) => (
                <div
                  key={quest.id}
                  className="rounded-lg bg-guild-dark/50 border border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="mb-1 text-lg font-semibold text-gray-400">
                        {quest.title}
                      </h3>
                      <p className="text-sm text-gray-500">ドラフト状態</p>
                    </div>
                    <span className="text-xl font-bold text-gray-500">
                      {quest.points} pt
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">ドラフトのクエストはありません</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
