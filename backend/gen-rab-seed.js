#!/usr/bin/env python3
# gen-rab-seed.py - Generates prisma/seed-rab-full.ts
# Run: node gen-rab-seed.js

const fs = require('fs');
const path = require('path');

const lines = [];

lines.push('/**');
lines.push(' * seed-rab-full.ts');
lines.push(' * Comprehensive RAB seed with all modules:');
lines.push(' * - RABs across all statuses');
lines.push(' * - Baseline schedules for S-curve');
lines.push(' * - Schedule metadata on items');
lines.push(' * - Progress tracking');
lines.push(' * - Daily reports with workforce/weather');
lines.push(' * - Holidays');
lines.push(' * - Submissions, logbook, memos, letters, billings');
lines.push(' */');
lines.push('');
lines.push("import { PrismaClient } from '@prisma/client';");
lines.push('');
lines.push('const prisma = new PrismaClient();');
lines.push('');
lines.push('async function seedRabFull(adminId: string) {');
lines.push('  console.log("=== Starting seedRabFull ===");');
lines.push('');
lines.push('  const hendra = await prisma.signatory.findFirst({ where: { name: { contains: "Hendra" } } });');
lines.push('  const budi   = await prisma.signatory.findFirst({ where: { name: { contains: "Budi" } } });');
lines.push('  const rina   = await prisma.signatory.findFirst({ where: { name: { contains: "Rina" } } });');
lines.push('');

const output = lines.join('\n');
fs.writeFileSync('prisma/seed-rab-full.ts', output, 'utf8');
console.log('Written header: ' + output.length + ' chars');
