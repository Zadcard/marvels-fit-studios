import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from .env");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 12);

  console.log("Seeding database...");

  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email: "admin@test.com",
      name: "System Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin created: admin@test.com");

  const coachUser = await prisma.user.upsert({
    where: { email: "coach@test.com" },
    update: {
      password: hashedPassword,
      role: "COACH",
    },
    create: {
      email: "coach@test.com",
      name: "Coach User",
      password: hashedPassword,
      role: "COACH",
    },
  });

  const coach = await prisma.coach.upsert({
    where: { userId: coachUser.id },
    update: {
      fullName: "Coach User",
    },
    create: {
      fullName: "Coach User",
      userId: coachUser.id,
    },
  });
  console.log("Coach created: coach@test.com");

  const clientUser = await prisma.user.upsert({
    where: { email: "client@test.com" },
    update: {
      password: hashedPassword,
      role: "CLIENT",
    },
    create: {
      email: "client@test.com",
      name: "Client User",
      password: hashedPassword,
      role: "CLIENT",
    },
  });

  const client = await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {
      fullName: "Client User",
    },
    create: {
      fullName: "Client User",
      userId: clientUser.id,
    },
  });
  console.log("Client created: client@test.com");

  const group = await prisma.group.upsert({
    where: { id: "seed-group-strength-foundations" },
    update: {
      name: "Strength Foundations Crew",
      type: "GROUP",
      coachId: coach.id,
    },
    create: {
      id: "seed-group-strength-foundations",
      name: "Strength Foundations Crew",
      type: "GROUP",
      coachId: coach.id,
    },
  });
  console.log("Coach group created: Strength Foundations Crew");

  await prisma.client.update({
    where: { id: client.id },
    data: {
      groupId: group.id,
    },
  });
  console.log("Client assigned to coach group");

  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "starter-monthly" },
    update: {
      name: "Starter Monthly",
      description: "Eight coached sessions each month.",
      billingCycle: "MONTHLY",
      sessionsIncluded: 8,
      price: 1800,
      currency: "EGP",
      isActive: true,
    },
    create: {
      name: "Starter Monthly",
      slug: "starter-monthly",
      description: "Eight coached sessions each month.",
      billingCycle: "MONTHLY",
      sessionsIncluded: 8,
      price: 1800,
      currency: "EGP",
      isActive: true,
    },
  });
  console.log("Subscription plan created: starter-monthly");

  const clientSubscription = await prisma.clientSubscription.upsert({
    where: {
      clientId_planId: {
        clientId: client.id,
        planId: starterPlan.id,
      },
    },
    update: {
      status: "ACTIVE",
      startsAt: new Date("2026-04-01T00:00:00.000Z"),
      renewsAt: new Date("2026-05-01T00:00:00.000Z"),
      sessionsTotal: 8,
      sessionsUsed: 2,
      isAutoRenew: true,
    },
    create: {
      clientId: client.id,
      planId: starterPlan.id,
      status: "ACTIVE",
      startsAt: new Date("2026-04-01T00:00:00.000Z"),
      renewsAt: new Date("2026-05-01T00:00:00.000Z"),
      sessionsTotal: 8,
      sessionsUsed: 2,
      isAutoRenew: true,
    },
  });
  console.log("Client subscription created for client@test.com");

  const scheduleBlock = await prisma.scheduleBlock.upsert({
    where: { id: "seed-block-strength-foundations" },
    update: {
      title: "Strength Foundations",
      description: "Recurring intro block for new members to learn the weekly movement pattern.",
      sessionType: "GROUP",
      status: "ACTIVE",
      recurrenceType: "WEEKLY",
      recurrenceDays: ["SUNDAY", "TUESDAY", "THURSDAY"],
      startsOn: new Date("2026-04-01T00:00:00.000Z"),
      endsOn: new Date("2026-05-01T00:00:00.000Z"),
      startTime: "18:00",
      endTime: "19:00",
      timezone: "Africa/Cairo",
      capacity: 12,
      location: "Main Floor",
      coachId: coach.id,
      groupId: group.id,
      createdById: coachUser.id,
    },
    create: {
      id: "seed-block-strength-foundations",
      title: "Strength Foundations",
      description: "Recurring intro block for new members to learn the weekly movement pattern.",
      sessionType: "GROUP",
      status: "ACTIVE",
      recurrenceType: "WEEKLY",
      recurrenceDays: ["SUNDAY", "TUESDAY", "THURSDAY"],
      startsOn: new Date("2026-04-01T00:00:00.000Z"),
      endsOn: new Date("2026-05-01T00:00:00.000Z"),
      startTime: "18:00",
      endTime: "19:00",
      timezone: "Africa/Cairo",
      capacity: 12,
      location: "Main Floor",
      coachId: coach.id,
      groupId: group.id,
      createdById: coachUser.id,
    },
  });
  console.log("Schedule block created: Strength Foundations");

  await prisma.scheduleBlockClient.upsert({
    where: {
      scheduleBlockId_clientId: {
        scheduleBlockId: scheduleBlock.id,
        clientId: client.id,
      },
    },
    update: {},
    create: {
      scheduleBlockId: scheduleBlock.id,
      clientId: client.id,
    },
  });
  console.log("Client added to recurring block");

  const trainingSession = await prisma.trainingSession.upsert({
    where: { id: "seed-strength-foundations-session" },
    update: {
      title: "Strength Foundations",
      description: "Intro block for new members to learn the weekly movement pattern.",
      type: "GROUP",
      status: "SCHEDULED",
      startsAt: new Date("2026-04-10T16:00:00.000Z"),
      endsAt: new Date("2026-04-10T17:00:00.000Z"),
      capacity: 12,
      location: "Main Floor",
      coachId: coach.id,
      groupId: group.id,
      scheduleBlockId: scheduleBlock.id,
      createdById: coachUser.id,
    },
    create: {
      id: "seed-strength-foundations-session",
      title: "Strength Foundations",
      description: "Intro block for new members to learn the weekly movement pattern.",
      type: "GROUP",
      status: "SCHEDULED",
      startsAt: new Date("2026-04-10T16:00:00.000Z"),
      endsAt: new Date("2026-04-10T17:00:00.000Z"),
      capacity: 12,
      location: "Main Floor",
      coachId: coach.id,
      groupId: group.id,
      scheduleBlockId: scheduleBlock.id,
      createdById: coachUser.id,
    },
  });
  console.log("Training session created: Strength Foundations");

  await prisma.sessionBooking.upsert({
    where: {
      trainingSessionId_clientId: {
        trainingSessionId: trainingSession.id,
        clientId: client.id,
      },
    },
    update: {
      status: "BOOKED",
      source: "BLOCK",
    },
    create: {
      trainingSessionId: trainingSession.id,
      clientId: client.id,
      status: "BOOKED",
      source: "BLOCK",
    },
  });
  console.log("Session booking created for client@test.com");

  await prisma.workoutNote.upsert({
    where: { id: "seed-client-workout-note" },
    update: {
      content:
        "Recovery pacing is improving. Keep the next block slightly lighter and reinforce cleaner tempo.",
      date: new Date("2026-04-08T12:00:00.000Z"),
      clientId: client.id,
    },
    create: {
      id: "seed-client-workout-note",
      content:
        "Recovery pacing is improving. Keep the next block slightly lighter and reinforce cleaner tempo.",
      date: new Date("2026-04-08T12:00:00.000Z"),
      clientId: client.id,
    },
  });
  console.log("Workout note created for client@test.com");

  await prisma.sessionNote.upsert({
    where: { id: "seed-session-note" },
    update: {
      content: "Coach should open with a short rhythm reset before loading progression.",
      trainingSessionId: trainingSession.id,
      authorId: coachUser.id,
    },
    create: {
      id: "seed-session-note",
      content: "Coach should open with a short rhythm reset before loading progression.",
      trainingSessionId: trainingSession.id,
      authorId: coachUser.id,
    },
  });
  console.log("Session note created for Strength Foundations");

  await prisma.payment.upsert({
    where: { id: "seed-client-subscription-payment" },
    update: {
      amount: 1800,
      currency: "EGP",
      note: "Seed payment for the starter monthly subscription.",
      clientId: client.id,
      clientSubscriptionId: clientSubscription.id,
    },
    create: {
      id: "seed-client-subscription-payment",
      amount: 1800,
      currency: "EGP",
      note: "Seed payment for the starter monthly subscription.",
      clientId: client.id,
      clientSubscriptionId: clientSubscription.id,
    },
  });
  console.log("Payment created for client@test.com");

  console.log("\nSeeding complete!");
  console.log("Password for all users: password123");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
