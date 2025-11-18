import Link from "next/link";
import { getServerAuthSession } from "~/server/auth";

export default async function Home() {
  const session = await getServerAuthSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-guild-darker to-guild-dark">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Nova <span className="text-guild-primary">Agora</span>
        </h1>
        <p className="text-xl text-gray-300 text-center max-w-2xl">
          支援者限定ギルドプラットフォーム
          <br />
          クリエイターと支援者をつなぐ、次世代のコミュニティ
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-6 text-white hover:bg-white/20 transition-colors">
            <h3 className="text-2xl font-bold">ギルド型コミュニティ</h3>
            <div className="text-lg">
              プロジェクト単位でギルドを作成し、支援者限定の深いコミュニケーションを実現
            </div>
          </div>

          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-6 text-white hover:bg-white/20 transition-colors">
            <h3 className="text-2xl font-bold">クエストシステム</h3>
            <div className="text-lg">
              メンバーに課題を出し、達成に応じてポイントを付与。エンゲージメントを促進
            </div>
          </div>

          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-6 text-white hover:bg-white/20 transition-colors">
            <h3 className="text-2xl font-bold">AIキュレーション</h3>
            <div className="text-lg">
              週次ハイライトの自動生成や、長文スレッドの要約機能で情報を整理
            </div>
          </div>

          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-6 text-white hover:bg-white/20 transition-colors">
            <h3 className="text-2xl font-bold">BPES戦略</h3>
            <div className="text-lg">
              希少性・好奇心・損失回避・社会的証明を活用した心理的エンゲージメント
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {session ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-guild-primary px-10 py-3 font-semibold text-white no-underline transition hover:bg-guild-secondary"
            >
              ダッシュボードへ
            </Link>
          ) : (
            <Link
              href="/api/auth/signin"
              className="rounded-full bg-guild-primary px-10 py-3 font-semibold text-white no-underline transition hover:bg-guild-secondary"
            >
              ログイン / 登録
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
