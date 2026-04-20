require("dotenv/config");

const { PrismaClient, LeadStatus, UserRole } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

function getPrisma() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing from environment");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  return { prisma, pool };
}

function printUsage() {
  console.log(`
Usage:
  npm run promote:leads -- --all
  npm run promote:leads -- --email user@example.com
  npm run promote:leads -- --email one@example.com --email two@example.com
  npm run promote:leads -- --all --limit 10
  npm run promote:leads -- --all --dry-run

Options:
  --all           Convert leads with status NEW or CONTACTED
  --email <addr>  Convert only the lead matching this email
  --limit <n>     Limit the number of leads processed
  --dry-run       Show what would happen without writing changes
  --help          Show this help message
`);
}

function parseArgs(argv) {
  const emails = [];
  let limit;
  let dryRun = false;
  let selectAll = false;
  let showHelp = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--email": {
        const email = argv[index + 1];
        if (!email) {
          throw new Error("--email requires a value.");
        }
        emails.push(email);
        index += 1;
        break;
      }
      case "--limit": {
        const rawLimit = argv[index + 1];
        if (!rawLimit) {
          throw new Error("--limit requires a value.");
        }
        const parsedLimit = Number.parseInt(rawLimit, 10);
        if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
          throw new Error("--limit must be a positive integer.");
        }
        limit = parsedLimit;
        index += 1;
        break;
      }
      case "--dry-run":
        dryRun = true;
        break;
      case "--all":
        selectAll = true;
        break;
      case "--help":
      case "-h":
        showHelp = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!showHelp && !selectAll && emails.length === 0) {
    throw new Error("Choose either --all or at least one --email.");
  }

  return {
    emails,
    includeStatuses: selectAll ? [LeadStatus.NEW, LeadStatus.CONTACTED] : undefined,
    limit,
    dryRun,
    showHelp,
  };
}

function normalizeEmails(emails) {
  return emails
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

async function promoteLeadsToClients(prisma, input) {
  const emails = normalizeEmails(input.emails || []);
  const leads = await prisma.lead.findMany({
    where: emails.length > 0
      ? { email: { in: emails } }
      : { status: { in: input.includeStatuses || [LeadStatus.NEW, LeadStatus.CONTACTED] } },
    orderBy: [{ createdAt: "asc" }],
    ...(input.limit ? { take: input.limit } : {}),
  });

  const results = [];

  for (const lead of leads) {
    const normalizedEmail = lead.email ? lead.email.trim().toLowerCase() : null;

    if (!normalizedEmail) {
      results.push({
        leadId: lead.id,
        email: lead.email,
        outcome: "skipped",
        details: "Lead has no email, so it cannot become a login account.",
      });
      continue;
    }

    if (!lead.passwordHash) {
      results.push({
        leadId: lead.id,
        email: normalizedEmail,
        outcome: "skipped",
        details: "Lead has no password hash, so credentials login would not work.",
      });
      continue;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { clientProfile: true },
    });

    if (existingUser && existingUser.role !== UserRole.CLIENT && !existingUser.clientProfile) {
      results.push({
        leadId: lead.id,
        email: normalizedEmail,
        outcome: "skipped",
        details: `Existing user has role ${existingUser.role}, so promotion was skipped to avoid changing a non-client account.`,
      });
      continue;
    }

    if (input.dryRun) {
      results.push({
        leadId: lead.id,
        email: normalizedEmail,
        outcome: "promoted",
        details: existingUser
          ? "Would attach a Client profile to the existing user and mark the lead as converted."
          : "Would create a User, create a Client profile, and mark the lead as converted.",
      });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      let user = existingUser;

      if (!user) {
        user = await tx.user.create({
          data: {
            email: normalizedEmail,
            name: lead.fullName,
            password: lead.passwordHash,
            mustChangePassword: true,
            role: UserRole.CLIENT,
          },
        });
      } else {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            name: user.name || lead.fullName,
            password: user.password || lead.passwordHash,
            mustChangePassword: user.password ? user.mustChangePassword : true,
            role: UserRole.CLIENT,
          },
        });
      }

      if (!existingUser || !existingUser.clientProfile) {
        await tx.client.create({
          data: {
            fullName: lead.fullName,
            phone: lead.phone,
            userId: user.id,
          },
        });
      }

      await tx.lead.update({
        where: { id: lead.id },
        data: { status: LeadStatus.CONVERTED },
      });
    });

    results.push({
      leadId: lead.id,
      email: normalizedEmail,
      outcome: "promoted",
      details: existingUser
        ? "Attached or confirmed a Client profile on the existing user and marked the lead as converted."
        : "Created a new User and Client profile and marked the lead as converted.",
    });
  }

  const promoted = results.filter((result) => result.outcome === "promoted").length;

  return {
    examined: leads.length,
    promoted,
    skipped: results.length - promoted,
    results,
  };
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.showHelp) {
    printUsage();
    return;
  }

  const { prisma, pool } = getPrisma();

  try {
    const summary = await promoteLeadsToClients(prisma, parsed);
    console.log(`Processed ${summary.examined} lead(s): ${summary.promoted} promoted, ${summary.skipped} skipped.`);

    for (const result of summary.results) {
      const emailLabel = result.email || "(no email)";
      console.log(`[${result.outcome.toUpperCase()}] ${emailLabel} - ${result.details}`);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Lead promotion failed: ${message}`);
  printUsage();
  process.exit(1);
});
