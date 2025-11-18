#!/usr/bin/env node
/**
 * Nova Agora CLI
 *
 * Administrative tool for managing guilds, users, and performing maintenance tasks.
 *
 * Usage:
 *   npx tsx src/cli/index.ts <command> [options]
 *
 * Commands:
 *   guilds:list              List all guilds
 *   guilds:create <name>     Create a new guild
 *   users:list               List all users
 *   users:promote <email>    Promote user to guild admin
 *   metrics:compute <date>   Compute guild metrics for a date
 *   seed                     Run database seed
 */

import { db } from "~/server/db";
import { logger } from "~/lib/logger";

const cli = logger.withContext({ source: "cli" });

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    printHelp();
    process.exit(0);
  }

  try {
    switch (command) {
      case "guilds:list":
        await listGuilds();
        break;

      case "guilds:create":
        await createGuild(args[1], args[2]);
        break;

      case "users:list":
        await listUsers();
        break;

      case "users:promote":
        await promoteUser(args[1], args[2], args[3]);
        break;

      case "metrics:compute":
        await computeMetrics(args[1]);
        break;

      case "seed":
        cli.info("Running seed... (Use 'npm run db:seed' instead)");
        break;

      case "help":
      case "--help":
      case "-h":
        printHelp();
        break;

      default:
        cli.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }

    await db.$disconnect();
  } catch (error) {
    cli.error("Command failed", error as Error);
    await db.$disconnect();
    process.exit(1);
  }
}

async function listGuilds() {
  const guilds = await db.guild.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      isPublic: true,
      createdAt: true,
      _count: {
        select: {
          memberships: true,
          posts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log("\n📊 Guilds:\n");
  console.log("ID".padEnd(28), "Name".padEnd(30), "Slug".padEnd(20), "Members", "Posts", "Public");
  console.log("─".repeat(120));

  for (const guild of guilds) {
    console.log(
      guild.id.padEnd(28),
      guild.name.substring(0, 28).padEnd(30),
      guild.slug.padEnd(20),
      String(guild._count.memberships).padEnd(7),
      String(guild._count.posts).padEnd(6),
      guild.isPublic ? "Yes" : "No"
    );
  }

  console.log(`\nTotal: ${guilds.length} guilds\n`);
}

async function createGuild(name?: string, slug?: string) {
  if (!name) {
    console.error("❌ Usage: guilds:create <name> [slug]");
    process.exit(1);
  }

  const guildSlug = slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Create with system user (first user in DB)
  const firstUser = await db.user.findFirst();

  if (!firstUser) {
    console.error("❌ No users found. Create a user first.");
    process.exit(1);
  }

  const guild = await db.guild.create({
    data: {
      name,
      slug: guildSlug,
      creatorId: firstUser.id,
      memberships: {
        create: {
          userId: firstUser.id,
          role: "ADMIN",
        },
      },
      channels: {
        create: [
          { name: "一般", slug: "general", position: 0 },
          { name: "お知らせ", slug: "announcements", position: 1 },
        ],
      },
    },
  });

  console.log(`\n✅ Guild created:`);
  console.log(`   ID: ${guild.id}`);
  console.log(`   Name: ${guild.name}`);
  console.log(`   Slug: ${guild.slug}`);
  console.log(`   Invite Code: ${guild.inviteCode}\n`);
}

async function listUsers() {
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      totalPoints: true,
      createdAt: true,
      _count: {
        select: {
          memberships: true,
          posts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log("\n👥 Users:\n");
  console.log("ID".padEnd(28), "Name".padEnd(25), "Email".padEnd(35), "Points", "Guilds", "Posts");
  console.log("─".repeat(120));

  for (const user of users) {
    console.log(
      user.id.padEnd(28),
      (user.name ?? "No name").substring(0, 23).padEnd(25),
      (user.email ?? "No email").substring(0, 33).padEnd(35),
      String(user.totalPoints).padEnd(6),
      String(user._count.memberships).padEnd(6),
      String(user._count.posts)
    );
  }

  console.log(`\nTotal: ${users.length} users\n`);
}

async function promoteUser(email?: string, guildSlug?: string, role?: string) {
  if (!email || !guildSlug || !role) {
    console.error("❌ Usage: users:promote <email> <guild-slug> <role>");
    console.error("   Roles: ADMIN, ELDER, MEMBER");
    process.exit(1);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }

  const guild = await db.guild.findUnique({ where: { slug: guildSlug } });
  if (!guild) {
    console.error(`❌ Guild not found: ${guildSlug}`);
    process.exit(1);
  }

  const validRoles = ["ADMIN", "ELDER", "MEMBER"];
  if (!validRoles.includes(role.toUpperCase())) {
    console.error(`❌ Invalid role: ${role}. Use: ${validRoles.join(", ")}`);
    process.exit(1);
  }

  await db.membership.update({
    where: {
      userId_guildId: {
        userId: user.id,
        guildId: guild.id,
      },
    },
    data: {
      role: role.toUpperCase() as "ADMIN" | "ELDER" | "MEMBER",
    },
  });

  console.log(`\n✅ User ${email} promoted to ${role.toUpperCase()} in guild ${guildSlug}\n`);
}

async function computeMetrics(dateStr?: string) {
  if (!dateStr) {
    console.error("❌ Usage: metrics:compute <YYYY-MM-DD>");
    process.exit(1);
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    console.error(`❌ Invalid date: ${dateStr}`);
    process.exit(1);
  }

  console.log(`\n📊 Computing metrics for ${dateStr}...\n`);

  const guilds = await db.guild.findMany();

  for (const guild of guilds) {
    // Compute metrics for this guild and date
    const totalMembers = await db.membership.count({
      where: { guildId: guild.id },
    });

    const activeMembers = await db.membership.count({
      where: {
        guildId: guild.id,
        lastActiveAt: {
          gte: new Date(date.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    const postsCreated = await db.post.count({
      where: {
        guildId: guild.id,
        createdAt: {
          gte: date,
          lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const engagementScore = totalMembers > 0
      ? Math.min(100, (activeMembers / totalMembers) * 100 + postsCreated * 2)
      : 0;

    await db.guildMetric.upsert({
      where: {
        guildId_date: {
          guildId: guild.id,
          date,
        },
      },
      create: {
        guildId: guild.id,
        date,
        totalMembers,
        activeMembers,
        postsCreated,
        engagementScore,
      },
      update: {
        totalMembers,
        activeMembers,
        postsCreated,
        engagementScore,
      },
    });

    console.log(`✅ ${guild.name}: ${totalMembers} members, ${activeMembers} active, ${postsCreated} posts (score: ${engagementScore.toFixed(1)})`);
  }

  console.log(`\n✅ Metrics computed for ${guilds.length} guilds\n`);
}

function printHelp() {
  console.log(`
Nova Agora CLI - Administrative Tool

Usage:
  npx tsx src/cli/index.ts <command> [options]

Commands:
  guilds:list                    List all guilds
  guilds:create <name> [slug]    Create a new guild
  users:list                     List all users
  users:promote <email> <guild-slug> <role>
                                 Promote user in a guild (ADMIN/ELDER/MEMBER)
  metrics:compute <YYYY-MM-DD>   Compute guild metrics for a date
  help                           Show this help message

Examples:
  npx tsx src/cli/index.ts guilds:list
  npx tsx src/cli/index.ts guilds:create "Tech Community" tech
  npx tsx src/cli/index.ts users:promote alice@example.com innovators-guild ADMIN
  npx tsx src/cli/index.ts metrics:compute 2024-01-15
`);
}

// Run if called directly
if (require.main === module) {
  main();
}
