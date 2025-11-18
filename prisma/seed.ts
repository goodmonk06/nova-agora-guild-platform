import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create users
  console.log("👤 Creating users...");
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice Anderson",
      bio: "クリエイター・プロデューサー。新しいコミュニティの形を模索中。",
      image: "https://i.pravatar.cc/150?img=1",
      totalPoints: 150,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      name: "Bob Builder",
      bio: "エンジニア兼デザイナー。オープンソースが大好き。",
      image: "https://i.pravatar.cc/150?img=2",
      totalPoints: 200,
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@example.com" },
    update: {},
    create: {
      email: "carol@example.com",
      name: "Carol Chen",
      bio: "アーティスト。デジタルアートと音楽制作。",
      image: "https://i.pravatar.cc/150?img=3",
      totalPoints: 120,
    },
  });

  const dave = await prisma.user.upsert({
    where: { email: "dave@example.com" },
    update: {},
    create: {
      email: "dave@example.com",
      name: "Dave Davis",
      bio: "ライター。テクノロジーとカルチャーについて執筆。",
      image: "https://i.pravatar.cc/150?img=4",
      totalPoints: 80,
    },
  });

  console.log("✅ Users created");

  // Create guilds
  console.log("🏰 Creating guilds...");
  const innovatorsGuild = await prisma.guild.upsert({
    where: { slug: "innovators-guild" },
    update: {},
    create: {
      name: "Innovators Guild",
      slug: "innovators-guild",
      description:
        "次世代のイノベーターが集まるギルド。テクノロジー、デザイン、アートの交差点で新しい価値を創造します。",
      image: "https://picsum.photos/seed/guild1/400/200",
      inviteCode: "INNOVATE2024",
      isPublic: false,
      creatorId: alice.id,
    },
  });

  const creatorsHub = await prisma.guild.upsert({
    where: { slug: "creators-hub" },
    update: {},
    create: {
      name: "Creators Hub",
      slug: "creators-hub",
      description:
        "クリエイターのためのコミュニティ。作品の共有、フィードバック、コラボレーションの場。",
      image: "https://picsum.photos/seed/guild2/400/200",
      inviteCode: "CREATE2024",
      isPublic: true,
      creatorId: bob.id,
    },
  });

  console.log("✅ Guilds created");

  // Create memberships
  console.log("👥 Creating memberships...");
  await prisma.membership.createMany({
    data: [
      // Innovators Guild
      {
        userId: alice.id,
        guildId: innovatorsGuild.id,
        role: "ADMIN",
        points: 150,
        intro:
          "このギルドの創設者です。みんなで素晴らしいコミュニティを作りましょう！",
        expertise: ["コミュニティ運営", "プロダクト開発", "戦略"],
      },
      {
        userId: bob.id,
        guildId: innovatorsGuild.id,
        role: "ELDER",
        points: 200,
        intro:
          "フルスタックエンジニアです。技術的な質問は何でもどうぞ！",
        expertise: ["TypeScript", "React", "Node.js"],
      },
      {
        userId: carol.id,
        guildId: innovatorsGuild.id,
        role: "MEMBER",
        points: 120,
        intro: "デジタルアートとUI/UXデザインが専門です。",
        expertise: ["UI/UX", "デジタルアート", "Figma"],
      },
      {
        userId: dave.id,
        guildId: innovatorsGuild.id,
        role: "MEMBER",
        points: 80,
        intro: "コンテンツ制作とストーリーテリングが得意です。",
        expertise: ["ライティング", "マーケティング", "SEO"],
      },
      // Creators Hub
      {
        userId: bob.id,
        guildId: creatorsHub.id,
        role: "ADMIN",
        points: 100,
        intro: "クリエイターの皆さん、一緒に作品を作りましょう！",
        expertise: ["開発", "デザイン", "プロトタイピング"],
      },
      {
        userId: carol.id,
        guildId: creatorsHub.id,
        role: "ELDER",
        points: 150,
        intro: "アート作品を定期的にシェアしています。",
        expertise: ["デジタルアート", "3Dモデリング", "アニメーション"],
      },
      {
        userId: alice.id,
        guildId: creatorsHub.id,
        role: "MEMBER",
        points: 60,
        intro: "クリエイティブな活動を応援しています！",
        expertise: ["プロデュース", "企画"],
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Memberships created");

  // Create channels
  console.log("📺 Creating channels...");
  const generalChannel = await prisma.channel.upsert({
    where: {
      guildId_slug: {
        guildId: innovatorsGuild.id,
        slug: "general",
      },
    },
    update: {},
    create: {
      name: "一般",
      slug: "general",
      description: "全般的な話題について気軽にディスカッション",
      guildId: innovatorsGuild.id,
      position: 0,
    },
  });

  const announceChannel = await prisma.channel.upsert({
    where: {
      guildId_slug: {
        guildId: innovatorsGuild.id,
        slug: "announcements",
      },
    },
    update: {},
    create: {
      name: "お知らせ",
      slug: "announcements",
      description: "重要なお知らせや更新情報",
      guildId: innovatorsGuild.id,
      position: 1,
    },
  });

  const techChannel = await prisma.channel.upsert({
    where: {
      guildId_slug: {
        guildId: innovatorsGuild.id,
        slug: "tech-talk",
      },
    },
    update: {},
    create: {
      name: "技術談義",
      slug: "tech-talk",
      description: "技術的なトピックについて深掘り",
      guildId: innovatorsGuild.id,
      position: 2,
    },
  });

  console.log("✅ Channels created");

  // Create threads
  console.log("🧵 Creating threads...");
  const welcomeThread = await prisma.thread.upsert({
    where: {
      channelId_slug: {
        channelId: generalChannel.id,
        slug: "welcome-to-innovators-guild",
      },
    },
    update: {},
    create: {
      title: "Innovators Guildへようこそ！",
      slug: "welcome-to-innovators-guild",
      channelId: generalChannel.id,
      isPinned: true,
      viewCount: 42,
    },
  });

  const projectThread = await prisma.thread.upsert({
    where: {
      channelId_slug: {
        channelId: techChannel.id,
        slug: "next-project-ideas",
      },
    },
    update: {},
    create: {
      title: "次のプロジェクトアイデア募集中",
      slug: "next-project-ideas",
      channelId: techChannel.id,
      isPinned: false,
      viewCount: 18,
    },
  });

  console.log("✅ Threads created");

  // Create posts
  console.log("📝 Creating posts...");
  const welcomePost = await prisma.post.create({
    data: {
      content: `# Innovators Guildへようこそ！🎉

このギルドは、次世代のイノベーターが集まる場所です。

## ギルドのルール
1. 互いに尊重し、建設的なフィードバックを心がけましょう
2. 積極的に作品やアイデアを共有しましょう
3. 他のメンバーの成長をサポートしましょう

## 始め方
- 自己紹介スレッドで自分を紹介してください
- 興味のあるチャンネルを探索してみましょう
- クエストに挑戦してポイントを獲得しましょう

みんなで素晴らしいコミュニティを作っていきましょう！`,
      authorId: alice.id,
      threadId: welcomeThread.id,
      isPinned: true,
    },
  });

  await prisma.post.create({
    data: {
      content:
        "ようこそ！早速ですが、みなさんの得意分野や興味のある技術について教えてください。私はフルスタック開発とデザインシステムに興味があります。",
      authorId: bob.id,
      threadId: welcomeThread.id,
    },
  });

  await prisma.post.create({
    data: {
      content:
        "こんにちは！デジタルアートとUI/UXデザインをやっています。最近はAIアートにも興味があって、色々実験中です。よろしくお願いします！",
      authorId: carol.id,
      threadId: welcomeThread.id,
    },
  });

  await prisma.post.create({
    data: {
      content: `次のプロジェクトとして、以下のアイデアを考えています：

1. **コミュニティ分析ツール** - メンバーのエンゲージメントを可視化
2. **AIアシスタント** - ギルド内のナレッジベースを活用したチャットボット
3. **コラボレーションプラットフォーム** - リアルタイムでの共同作業

どれが一番面白そうですか？他にもアイデアがあれば教えてください！`,
      authorId: alice.id,
      threadId: projectThread.id,
    },
  });

  await prisma.post.create({
    data: {
      content:
        "AIアシスタントが良さそう！RAGとか使って実装できたら便利だと思います。",
      authorId: bob.id,
      threadId: projectThread.id,
    },
  });

  // Create guild feed posts (not in threads)
  await prisma.post.create({
    data: {
      content: `今週のギルド活動まとめ 📊

- 新メンバー2名参加
- 完了したクエスト: 3件
- 活発なディスカッション: 技術談義チャンネル

来週も盛り上げていきましょう！`,
      authorId: alice.id,
      guildId: innovatorsGuild.id,
      isPinned: true,
      isAiHighlight: true,
    },
  });

  console.log("✅ Posts created");

  // Create reactions
  console.log("👍 Creating reactions...");
  await prisma.reaction.createMany({
    data: [
      { userId: bob.id, postId: welcomePost.id, type: "LIKE" },
      { userId: carol.id, postId: welcomePost.id, type: "LOVE" },
      { userId: dave.id, postId: welcomePost.id, type: "ROCKET" },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Reactions created");

  // Create quests
  console.log("⚔️ Creating quests...");
  const introQuest = await prisma.quest.create({
    data: {
      title: "自己紹介を投稿しよう",
      description: `ギルドメンバーに自己紹介をしましょう！

以下の内容を含めてください：
- 名前とバックグラウンド
- 得意なスキルや専門分野
- このギルドで達成したいこと
- 好きなプロジェクトや作品

カジュアルに書いてOKです。みんなであなたのことを知りたいです！`,
      points: 10,
      status: "ACTIVE",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      guildId: innovatorsGuild.id,
      creatorId: alice.id,
    },
  });

  const projectQuest = await prisma.quest.create({
    data: {
      title: "ミニプロジェクトを作ろう",
      description: `何か小さなプロジェクトを作って、コミュニティでシェアしましょう！

要件：
- 何でもOK（コード、デザイン、アート、記事など）
- 作品へのリンクまたはスクリーンショットを含める
- 制作過程や学んだことを簡単に説明する

完成度よりも、挑戦したことやプロセスを大切にします。`,
      points: 50,
      status: "ACTIVE",
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      guildId: innovatorsGuild.id,
      creatorId: alice.id,
    },
  });

  const helpQuest = await prisma.quest.create({
    data: {
      title: "他のメンバーをサポート",
      description: `コミュニティメンバーの質問に答えたり、フィードバックを提供しましょう。

目標：
- 少なくとも3つの投稿に有益なコメントをする
- 技術的な質問に回答する
- 他のメンバーの作品にフィードバックを提供する

このクエストは毎月リセットされます。`,
      points: 20,
      status: "ACTIVE",
      guildId: innovatorsGuild.id,
      creatorId: bob.id,
    },
  });

  console.log("✅ Quests created");

  // Create quest submissions
  console.log("📋 Creating quest submissions...");
  await prisma.questSubmission.create({
    data: {
      content: `# 自己紹介

こんにちは、Bobです！

## バックグラウンド
フルスタックエンジニアとして5年の経験があります。最近はNext.jsとTypeScriptに夢中です。

## スキル
- TypeScript / React / Node.js
- UI/UXデザイン
- システムアーキテクチャ

## 達成したいこと
このギルドで新しい技術を学び、面白いプロジェクトに参加したいです！

よろしくお願いします！`,
      userId: bob.id,
      questId: introQuest.id,
      status: "APPROVED",
      pointsAwarded: 10,
      feedback: "素晴らしい自己紹介です！ポイントを付与しました。",
      reviewedAt: new Date(),
    },
  });

  await prisma.questSubmission.create({
    data: {
      content: `自己紹介させてください！

デジタルアーティストのCarolです。UI/UXデザインとAIアートに興味があります。

このコミュニティでクリエイティブな刺激を受けたいです。よろしくお願いします！`,
      userId: carol.id,
      questId: introQuest.id,
      status: "PENDING",
    },
  });

  console.log("✅ Quest submissions created");

  console.log("✨ Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log("- Users: 4");
  console.log("- Guilds: 2");
  console.log("- Memberships: 7");
  console.log("- Channels: 3");
  console.log("- Threads: 2");
  console.log("- Posts: 7");
  console.log("- Quests: 3");
  console.log("- Quest Submissions: 2");
  console.log("\n🔑 Demo Credentials:");
  console.log("- alice@example.com (Admin of Innovators Guild)");
  console.log("- bob@example.com (Elder of Innovators Guild, Admin of Creators Hub)");
  console.log("- carol@example.com (Member)");
  console.log("- dave@example.com (Member)");
  console.log("\n🎫 Invite Codes:");
  console.log("- Innovators Guild: INNOVATE2024");
  console.log("- Creators Hub: CREATE2024");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
