#!/usr/bin/env python3
# Generates seed-rab-full.ts

content = []

# ===== HEADER =====
content.append('''/**
 * seed-rab-full.ts
 * Comprehensive RAB seed with all modules
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedRabFull(adminId: string) {
  console.log("=== Starting seedRabFull ===");

  const hendra = await prisma.signatory.findFirst({ where: { name: { contains: "Hendra" } } });
  const budi   = await prisma.signatory.findFirst({ where: { name: { contains: "Budi" } } });
  const rina   = await prisma.signatory.findFirst({ where: { name: { contains: "Rina" } } });

  // ===== 1. RAB-2026-001: APPROVED =====
  const rab1 = await prisma.rab.findFirst({ where: { number: "RAB-2026-001" } });
  if (rab1) {
    await prisma.rab.update({
      where: { id: rab1.id },
      data: { status: "APPROVED", scheduleStart: new Date("2026-02-01"), restDays: [0] },
    });

    const items1 = await prisma.rabItem.findMany({
      where: { section: { rabId: rab1.id } },
      orderBy: { order: "asc" },
    });

    // Schedule metadata per item
    const sched1 = [
      { startOffsetDays: 0,  durationDays: 42 },
      { startOffsetDays: 40, durationDays: 21 },
      { startOffsetDays: 58, durationDays: 44 },
      { startOffsetDays: 98, durationDays: 35 },
      { startOffsetDays: 130, durationDays: 60 },
      { startOffsetDays: 150, durationDays: 60 },
      { startOffsetDays: 200, durationDays: 90 },
      { startOffsetDays: 280, durationDays: 60 },
      { startOffsetDays: 240, durationDays: 30 },
      { startOffsetDays: 260, durationDays: 20 },
      { startOffsetDays: 200, durationDays: 90 },
      { startOffsetDays: 280, durationDays: 45 },
      { startOffsetDays: 300, durationDays: 45 },
      { startOffsetDays: 320, durationDays: 30 },
    ];

    for (let i = 0; i < items1.length && i < sched1.length; i++) {
      await prisma.rabItem.update({
        where: { id: items1[i].id },
        data: { startOffsetDays: sched1[i].startOffsetDays, durationDays: sched1[i].durationDays },
      });
    }
    console.log("Updated " + items1.length + " RAB-001 items with schedule metadata");
  }

''')

with open("prisma/seed-rab-full.ts", "w", encoding="utf-8") as out:
    out.write("".join(content))

print("Written header: " + str(len("".join(content))) + " chars")
