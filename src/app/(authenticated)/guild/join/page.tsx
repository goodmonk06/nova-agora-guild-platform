"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function JoinGuildPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const joinGuild = api.guild.joinByInvite.useMutation({
    onSuccess: (data) => {
      router.push(`/g/${data.guild.slug}/feed`);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!inviteCode.trim()) {
      setError("招待コードを入力してください");
      return;
    }

    joinGuild.mutate({ inviteCode: inviteCode.trim() });
  };

  return (
    <div className="min-h-screen bg-guild-darker">
      <nav className="border-b border-gray-800 bg-guild-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-white">
              Nova <span className="text-guild-primary">Agora</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>

        <div className="rounded-lg bg-guild-dark p-8">
          <h1 className="mb-6 text-3xl font-bold text-white">
            ギルドに参加
          </h1>

          {error && (
            <div className="mb-6 rounded-lg bg-red-900/30 border border-red-700 p-4 text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="inviteCode"
                className="block text-sm font-medium text-gray-300"
              >
                招待コード <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="mt-1 block w-full rounded-md bg-guild-darker px-4 py-3 text-white uppercase placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-guild-primary"
                placeholder="例: INNOVATE2024"
                maxLength={50}
              />
              <p className="mt-2 text-sm text-gray-500">
                ギルド管理者から受け取った招待コードを入力してください
              </p>
            </div>

            <div className="rounded-lg bg-guild-darker p-4 text-sm text-gray-400">
              <p className="mb-2 font-medium text-gray-300">
                ℹ️ 招待コードについて
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>招待コードはギルド管理者が発行します</li>
                <li>各ギルドには固有の招待コードがあります</li>
                <li>コードは大文字・小文字を区別しません</li>
                <li>すでに参加済みのギルドには再参加できません</li>
              </ul>
            </div>

            <div className="rounded-lg border border-guild-primary bg-guild-primary/10 p-4 text-sm">
              <p className="mb-2 font-medium text-guild-primary">
                🎮 デモ用招待コード
              </p>
              <div className="space-y-1 text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Innovators Guild:</span>
                  <code className="rounded bg-guild-darker px-2 py-1">
                    INNOVATE2024
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span>Creators Hub:</span>
                  <code className="rounded bg-guild-darker px-2 py-1">
                    CREATE2024
                  </code>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={joinGuild.isPending}
                className="flex-1 rounded-md bg-guild-primary px-6 py-3 font-semibold text-white hover:bg-guild-secondary disabled:opacity-50"
              >
                {joinGuild.isPending ? "参加中..." : "ギルドに参加"}
              </button>
              <Link
                href="/dashboard"
                className="rounded-md bg-gray-700 px-6 py-3 font-semibold text-white hover:bg-gray-600"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
