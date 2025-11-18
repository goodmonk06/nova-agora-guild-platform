"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { slugify } from "~/lib/utils";

export default function CreateGuildPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");

  const createGuild = api.guild.create.useMutation({
    onSuccess: (guild) => {
      router.push(`/g/${guild.slug}/feed`);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("ギルド名を入力してください");
      return;
    }

    const slug = slugify(name);
    if (!slug) {
      setError("有効なギルド名を入力してください（英数字を含む必要があります）");
      return;
    }

    createGuild.mutate({
      name: name.trim(),
      slug,
      description: description.trim() || undefined,
      isPublic,
    });
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
            新しいギルドを作成
          </h1>

          {error && (
            <div className="mb-6 rounded-lg bg-red-900/30 border border-red-700 p-4 text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300"
              >
                ギルド名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md bg-guild-darker px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-guild-primary"
                placeholder="例: Innovators Guild"
                maxLength={100}
              />
              <p className="mt-1 text-sm text-gray-500">
                スラッグ: {slugify(name) || "guild-name"}
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-300"
              >
                説明
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md bg-guild-darker px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-guild-primary"
                placeholder="このギルドについて簡単に説明してください"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-guild-darker text-guild-primary focus:ring-2 focus:ring-guild-primary"
              />
              <label htmlFor="isPublic" className="ml-2 text-sm text-gray-300">
                公開ギルド（誰でも参加可能）
              </label>
            </div>

            <div className="rounded-lg bg-guild-darker p-4 text-sm text-gray-400">
              <p className="mb-2 font-medium text-gray-300">
                ℹ️ ギルド作成後について
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>あなたは自動的に管理者（Admin）になります</li>
                <li>デフォルトで「一般」と「お知らせ」チャンネルが作成されます</li>
                <li>招待コードが自動生成されます</li>
                <li>チャンネルやクエストを自由に追加できます</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={createGuild.isPending}
                className="flex-1 rounded-md bg-guild-primary px-6 py-3 font-semibold text-white hover:bg-guild-secondary disabled:opacity-50"
              >
                {createGuild.isPending ? "作成中..." : "ギルドを作成"}
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
