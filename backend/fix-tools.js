const fs = require('fs');
let content = fs.readFileSync('src/services/tools.service.ts', 'utf8');
const lines = content.split('\n');

// Fix lines 745-748 specifically
// Line 745: loans: { none: { status: { in: ["OPEN", "OVERDUE"] } },
// Line 746: },
// Line 747: }),
// Line 748: prisma.toolLoan.count({ where: { status: { in: ["OPEN", "OVERDUE"] } }),

// Current broken lines 742-748:
const badBlock = `    prisma.masterTool.count({
      where: {
        isActive: true,
        loans: { none: { status: { in: ["OPEN", "OVERDUE"] } },
      },
    }),
    prisma.toolLoan.count({ where: { status: { in: ["OPEN", "OVERDUE"] } }),`;

// Correct version:
const goodBlock = `    prisma.masterTool.count({
      where: {
        isActive: true,
        loans: { none: { status: { in: ["OPEN", "OVERDUE"] } },
      },
    }),
    prisma.toolLoan.count({ where: { status: { in: ["OPEN", "OVERDUE"] } }),`;

if (content.includes(badBlock)) {
  content = content.replace(badBlock, goodBlock);
  fs.writeFileSync('src/services/tools.service.ts', content);
  console.log('Fixed getToolStats function!');
} else {
  console.log('Pattern not found - checking partial matches...');
  // Try to find what's there
  for (let i = 740; i < 750; i++) {
    console.log('Line', i+1, ':', JSON.stringify(lines[i]).slice(0, 80));
  }
}
