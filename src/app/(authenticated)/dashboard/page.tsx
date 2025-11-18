import Link from "next/link";
import { api } from "~/trpc/server";
import { getServerAuthSession } from "~/server/auth";

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  const guilds = await api.guild.getMyGuilds();

  return (
    <div className="min-h-screen bg-guild-darker">
      <nav className="border-b border-gray-800 bg-guild-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-white">
                Nova <span className="text-guild-primary">Agora</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">{session?.user?.name}</span>
              <Link
                href="/api/auth/signout"
                className="rounded-md bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-600"
              >
                ログアウト
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">マイギルド</h1>
          <Link
            href="/guild/create"
            className="rounded-md bg-guild-primary px-4 py-2 text-white hover:bg-guild-secondary"
          >
            新規ギルド作成
          </Link>
        </div>

        {guilds.length === 0 ? (
          <div className="rounded-lg bg-guild-dark p-12 text-center">
            <h2 className="mb-4 text-xl font-semibold text-gray-300">
              まだギルドに参加していません
            </h2>
            <p className="mb-6 text-gray-400">
              招待コードを使ってギルドに参加するか、新しいギルドを作成しましょう
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/guild/join"
                className="rounded-md bg-guild-secondary px-6 py-3 text-white hover:bg-purple-700"
              >
                招待コードで参加
              </Link>
              <Link
                href="/guild/create"
                className="rounded-md bg-guild-primary px-6 py-3 text-white hover:bg-guild-secondary"
              >
                新規ギルド作成
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {guilds.map((guild) => (
              <Link
                key={guild.id}
                href={`/g/${guild.slug}/feed`}
                className="group rounded-lg bg-guild-dark p-6 transition-colors hover:bg-gray-800"
              >
                <div className="mb-4 flex items-start justify-between">
                  <h2 className="text-xl font-bold text-white group-hover:text-guild-primary">
                    {guild.name}
                  </h2>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      guild.memberships[0]?.role === "ADMIN"
                        ? "bg-guild-accent text-white"
                        : guild.memberships[0]?.role === "ELDER"
                          ? "bg-guild-secondary text-white"
                          : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {guild.memberships[0]?.role === "ADMIN"
                      ? "管理者"
                      : guild.memberships[0]?.role === "ELDER"
                        ? "エルダー"
                        : "メンバー"}
                  </span>
                </div>

                {guild.description && (
                  <p className="mb-4 line-clamp-2 text-gray-400">
                    {guild.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{guild._count.memberships} メンバー</span>
                  <span>{guild._count.channels} チャンネル</span>
                  {guild.memberships[0] && (
                    <span className="ml-auto text-guild-primary">
                      {guild.memberships[0].points} ポイント
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
