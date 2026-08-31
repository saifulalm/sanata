/**
 * Lesson Learned Seed Data
 * Continuous improvement lessons from QC rework
 * Run: npx tsx prisma/seed-lesson-learned.ts
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// WBS Stages
const WBS_STAGES = [
  "PRE_CONSTRUCTION",
  "SITE_PREPARATION",
  "EARTHWORK",
  "FOUNDATION",
  "STRUCTURE",
  "MASONRY",
  "ROOF",
  "MEP",
  "WATERPROOFING",
  "PLASTER_SCREED",
  "FLOOR_WALL_FINISH",
  "CEILING",
  "DOORS_WINDOWS",
  "PAINTING",
  "EXTERNAL_WORKS",
  "TESTING_COMMISSIONING",
  "SNAGGING",
  "HANDOVER",
] as const;

// Severity levels
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

// Realistic Indonesian construction lessons learned
const LESSON_LEARNED_DATA = [
  // FOUNDATION
  {
    wbsStage: "FOUNDATION",
    severity: "CRITICAL",
    title: "Strauss pile deviation exceeds tolerance",
    description: "During QC inspection, 3 of 15 strauss piles were found with verticality deviation > 1.5% from center line, exceeding project tolerance of 1%.",
    rootCause: "Drilling operator did not use guide template consistently; soil conditions harder than anticipated causing bit wandering.",
    correctiveAction: "Re-drilled affected piles with strict guide template usage. Implemented 100% verticality check before concrete pouring.",
    preventiveAction: "Require mandatory use of guide template for all strauss pile drilling. Add soil investigation section to method statement.",
    occurredAt: new Date("2026-05-15"),
  },
  {
    wbsStage: "FOUNDATION",
    severity: "HIGH",
    title: "Concrete cover on pile cap insufficient",
    description: "Reinforcement cage cover measured only 40mm instead of required 75mm on pile cap top layer.",
    rootCause: "Spacer blocks were placed only on bottom and sides, forgotten for top layer. QC team checked only after rebar fixer reported issue.",
    correctiveAction: "Installed additional spacer blocks. Added top layer cover check to pre-pour checklist.",
    preventiveAction: "Create specific spacer placement checklist with photo evidence requirement. QC inspector must verify all 4 faces.",
  },

  // STRUCTURE
  {
    wbsStage: "STRUCTURE",
    severity: "HIGH",
    title: "Column concrete honeycombing at construction joint",
    description: "Honeycombing found at column-beam joint interface on 4th floor, spanning approximately 30cm width.",
    rootCause: "Concrete vibration not reaching bottom of beam-column intersection due to dense reinforcement. Workmanship issue - vibrator not inserted deep enough.",
    correctiveAction: "Chipped out honeycombed concrete, applied bonding agent, and grouted with non-shrink mortar.",
    preventiveAction: "Require second vibrator for dense reinforcement areas. Add inspection point (hold point) for construction joints.",
  },
  {
    wbsStage: "STRUCTURE",
    severity: "MEDIUM",
    title: "Beam concrete strength below design (K-300 vs K-350)",
    description: "Core drill test results show compressive strength 295 kg/cm², below required K-350 (350 kg/cm²).",
    rootCause: "Water added on-site during hot weather to improve workability. Cement aggregate ratio deviated from mix design.",
    correctiveAction: "Structural engineer assessed that 295 kg/cm² acceptable for this application (reduction in safety factor). Documented with engineered memo.",
    preventiveAction: "Prohibit water addition on-site. Use ice or chilled water in hot weather. Increase slump test frequency.",
    occurredAt: new Date("2026-07-20"),
  },
  {
    wbsStage: "STRUCTURE",
    severity: "HIGH",
    title: "Column reinforcement lap splice location non-compliant",
    description: "Lap splice location at column-floor intersection where tension forces are highest, violating SNI 2847 requirements.",
    rootCause: "Rebar fixer misunderstood drawing - thought lap could be at any floor level. Foreman not reviewed drawing in detail.",
    correctiveAction: "Additional rebar dowels anchored into column from above. Cost shared between contractor and fixer.",
    preventiveAction: "All lap splice locations must be highlighted in shop drawing. Foreman must sign off on rebar placement before concrete.",
  },

  // MASONRY
  {
    wbsStage: "MASONRY",
    severity: "MEDIUM",
    title: "Masonry wall verticality out of tolerance",
    description: "3 meter high masonry wall leaning 12mm from vertical (tolerance 6mm per 3m height).",
    rootCause: "Mortar mixing done manually without proper proportioning. Some batches too dry causing slippage before setting.",
    correctiveAction: "Dismantled and rebuilt 2.5m of affected wall section.",
    preventiveAction: "Use mechanical mixer with automated proportioning. Implement string line guide for full wall height.",
  },
  {
    wbsStage: "MASONRY",
    severity: "LOW",
    title: "Mortar joint color inconsistency",
    description: "Visible color variation in mortar joints across facade, aesthetic issue despite structural soundness.",
    rootCause: "Different sand sources used when primary supplier ran out. Pigment content varied between batches.",
    correctiveAction: "Applied tinted mortar paint to unify appearance after structural acceptance.",
    preventiveAction: "Source all sand from single quarry upfront. Stock minimum 2 weeks supply before masonry commencement.",
    occurredAt: new Date("2026-08-05"),
  },

  // WATERPROOFING
  {
    wbsStage: "WATERPROOFING",
    severity: "CRITICAL",
    title: "Water tank waterproofing failure",
    description: "Water seepage through waterproofed water tank walls 2 weeks after completion. Tank on 5th floor affecting unit below.",
    rootCause: "Membrane application at corner joints insufficient overlap (50mm instead of 100mm). Primer coat not applied at corners before membrane.",
    correctiveAction: "Complete waterproofing removal and reapplication by specialist contractor. Hydrostatic test before backfill.",
    preventiveAction: "Require certified waterproofing specialist for all tank/basin work. Mandatory corner reinforcement detail review before application.",
    occurredAt: new Date("2026-06-28"),
  },
  {
    wbsStage: "WATERPROOFING",
    severity: "HIGH",
    title: "Roof deck waterproofing blistering",
    description: "Multiple blisters appeared on applied waterproofing membrane after 1 week. Potential leak points identified.",
    rootCause: "Moisture trapped under membrane - concrete substrate not fully cured/dry when membrane applied. Ambient humidity too high.",
    correctiveAction: "Blistered sections cut out, substrate dried with torch, patch repairs applied.",
    preventiveAction: "Implement moisture content test (<5%) before membrane application. No application during rain or >85% humidity.",
  },

  // PLASTER_SCREED
  {
    wbsStage: "PLASTER_SCREED",
    severity: "MEDIUM",
    title: "Plaster cracking along beam-wall interface",
    description: "Hairline cracks appeared along plaster-beam intersection after 2 weeks curing.",
    rootCause: "Plaster applied without proper mesh reinforcement at dissimilar material junction. Thermal expansion coefficient difference between beam (concrete) and brick wall.",
    correctiveAction: "Routed cracks and filled with flexible sealant. Repainted affected areas.",
    preventiveAction: "Mandatory PVC mesh strip reinforcement at all beam-wall, column-wall junctions. Add to plaster method statement.",
    occurredAt: new Date("2026-08-10"),
  },
  {
    wbsStage: "PLASTER_SCREED",
    severity: "LOW",
    title: "Floor screed hollow sound areas",
    description: "Hammer tap test revealed 15% of floor screed area with hollow sound indicating debonding.",
    rootCause: "Insufficient primer applied. Contaminated substrate (dust, oil) reduced bond. Inconsistent curing - some areas dried too fast.",
    correctiveAction: "Areas with hollow sound removed and re-laid. Others with acceptable bond maintained.",
    preventiveAction: "Pressure wash and prime all substrates. Wet curing for minimum 7 days. Add bond test requirement.",
  },

  // FLOOR_WALL_FINISH
  {
    wbsStage: "FLOOR_WALL_FINISH",
    severity: "MEDIUM",
    title: "Ceramic tile debonding in wet area",
    description: "Multiple tiles debonded from bathroom floor 1 month after handover. Grout discoloration indicating water penetration.",
    rootCause: "Tile adhesive pot life exceeded (mix prepared for 4 hours, used throughout). Coverage < 85% at some tiles. No waterproofing membrane under tile.",
    correctiveAction: "Removed and re-laid all affected tiles with fresh adhesive and proper waterproofing system.",
    preventiveAction: "Pot life signage at mixing station. Minimum 90% adhesive coverage requirement. Waterproofing mandatory for wet areas before tiling.",
    occurredAt: new Date("2026-08-15"),
  },
  {
    wbsStage: "FLOOR_WALL_FINISH",
    severity: "LOW",
    title: "Marble floor lippage at joints",
    description: "Floor marble tiles have 2-3mm height difference at joints, creating trip hazard and aesthetic issue.",
    rootCause: "Subfloor leveling not perfect. Installer did not use leveling system. Inconsistent adhesive bed thickness.",
    correctiveAction: "Ground down high tiles with diamond grinder. Filled low areas with epoxy grout.",
    preventiveAction: "All stone/marble floors require prepoured self-leveling compound. Mandatory use of tile leveling system.",
  },

  // PAINTING
  {
    wbsStage: "PAINTING",
    severity: "MEDIUM",
    title: "Paint peeling on exterior wall",
    description: "Large area of paint peeling from exterior wall after first rain season. Primer-adhesive failure.",
    rootCause: "Moisture in substrate not addressed before painting. Exterior primer specified but interior primer used on lower floors to save cost.",
    correctiveAction: "Removed all peeling paint, dried substrate, applied proper exterior primer, 2 coats premium exterior paint.",
    preventiveAction: "Moisture meter reading required <10% before painting. Separate primer specification for exterior with compliance check.",
    occurredAt: new Date("2026-07-01"),
  },
  {
    wbsStage: "PAINTING",
    severity: "LOW",
    title: "Paint color variation between batches",
    description: "Touch-up paint visible as different shade from original. Batch numbers not recorded.",
    rootCause: "Different paint batches used without recording. New batch delivered with slightly different pigment ratio.",
    preventiveAction: "Record batch numbers on paint log. Order all paint for each color from single batch with 10% extra. Return excess for future touch-up.",
  },

  // ROOF
  {
    wbsStage: "ROOF",
    severity: "HIGH",
    title: "Roof gutter overflow during heavy rain",
    description: "Gutters overflowed causing water ingress at ceiling junction. Occupant complaints received.",
    rootCause: "Gutter capacity calculated incorrectly. Downpipe positions created overflow points. Gutter fall insufficient.",
    correctiveAction: "Added additional downpipes. Modified gutter shape to increase capacity. Installed leaf guards.",
    preventiveAction: "Recalculate gutter sizing per SNI with 100-year rain intensity data. On-site flow test during first heavy rain.",
    occurredAt: new Date("2026-08-18"),
  },
  {
    wbsStage: "ROOF",
    severity: "MEDIUM",
    title: "Metal roof fastener corrosion",
    description: "Roof fastener heads showing rust after 6 months exposure. Potential leak paths forming.",
    rootCause: "Standard carbon steel fasteners used instead of stainless or HDG as specified. Corrosion accelerated by coastal atmosphere.",
    correctiveAction: "Replaced all fasteners with HDG bolts. Applied rust converter and paint to existing rust spots.",
    preventiveAction: "All exterior fasteners must be stainless steel 304 minimum. Add fastener specification to material approval process.",
  },

  // MEP
  {
    wbsStage: "MEP",
    severity: "HIGH",
    title: "Electrical conduit clash with structural beam",
    description: "Electrical conduit routing conflicted with structural beam during installation. Required structural beam modification (not allowed).",
    rootCause: "MEP drawings coordinated separately from structural without proper clash detection. No BIM coordination meetings held.",
    correctiveAction: "Rerouted conduits through slab with additional core drilling. Additional cost for structural engineer consultation.",
    preventiveAction: "Mandatory BIM coordination with all trades before construction. Weekly coordination meetings with clash detection reports.",
  },
  {
    wbsStage: "MEP",
    severity: "MEDIUM",
    title: "Plumbing blockage due to incorrect gradient",
    description: "Bathroom drain on 3rd floor frequently clogged. CCTV inspection revealed standing water in pipe.",
    rootCause: "Pipe gradient only 1% instead of minimum 2% per code. Calculated gradient incorrectly during installation.",
    correctiveAction: "Re-pitched affected pipes to 2.5% gradient. Additional cleanouts installed.",
    preventiveAction: "All drainage gradients must be surveyed and documented before concealment. Minimum gradient signage at work area.",
    occurredAt: new Date("2026-08-12"),
  },

  // SAFETY
  {
    wbsStage: "STRUCTURE",
    severity: "CRITICAL",
    title: "Scaffolding near-miss incident",
    description: "Worker fell 2 meters from scaffolding due to unsecured platform board. Near-miss - no serious injury due to safety net below.",
    rootCause: "Platform board not lashed/secured. Worker stepped on board edge causing it to flip. Morning toolbox meeting did not cover scaffolding checks.",
    correctiveAction: "100% inspection of all scaffolding before use. All platform boards to be secured with clips or lashing. Safety nets mandatory at all levels >2m.",
    preventiveAction: "Scaffolding checklist mandatory before each shift. Competent person certification required for all scaffolding erectors. Weekly third-party inspection.",
  },

  // GENERAL
  {
    wbsStage: "PRE_CONSTRUCTION",
    severity: "HIGH",
    title: "Shop drawing approval delay causing rework",
    description: "Approved shop drawings for bathroom fixtures did not match as-built conditions. Fixtures had to be repositioned causing tile rework.",
    rootCause: "As-built measurement taken from old drawings not verified on-site before shop drawing preparation.",
    correctiveAction: "On-site re-measurement, revised shop drawings, adjusted fixture positions, minimal tile rework achieved.",
    preventiveAction: "Mandatory site measurement verification before all shop drawing preparation. As-built drawings to be verified against design before construction start.",
    occurredAt: new Date("2026-04-10"),
  },
  {
    wbsStage: "PRE_CONSTRUCTION",
    severity: "MEDIUM",
    title: "Material delivery delay due to import clearance",
    description: "Specialty tiles from Italy delayed 6 weeks at customs, impacting tile work schedule.",
    rootCause: "Import documentation not prepared in advance. HS code classification incorrect causing additional inspection.",
    correctiveAction: "Expedited clearance with correct documentation. Partial shipment airfreighted to maintain schedule.",
    preventiveAction: "All imported materials: begin documentation process 8 weeks before needed on-site. Pre-clearance consultation with customs broker.",
  },
];

// Helper to get random element
function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Seeding Lesson Learned data...");

  // Check existing count
  const existingCount = await prisma.lessonLearned.count();
  console.log(`Existing Lesson Learned records: ${existingCount}`);

  if (existingCount > 0) {
    const input = process.argv[2];
    if (input !== "--force") {
      console.log("Lesson Learned data already exists. Run with --force to reseed.");
      console.log("Skipping seed...");
      return;
    }
    console.log("Force mode: deleting existing records...");
    await prisma.lessonLearned.deleteMany({});
  }

  // Get admin user for createdById
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  const createdById = adminUser?.id || null;

  // Get some QC records with REWORK result for linking
  const reworkRecords = await prisma.qcRecord.findMany({
    where: { result: "REWORK" },
    take: 5,
    select: { id: true, wbsStage: true, itemDesc: true, qcCode: true, checkDate: true },
  });

  let created = 0;

  for (const data of LESSON_LEARNED_DATA) {
    try {
      // Randomly link to a rework QC record if available (20% chance)
      let qcRecordId: string | undefined = undefined;
      if (reworkRecords.length > 0 && Math.random() < 0.2) {
        const linkedRework = randomElement(reworkRecords);
        qcRecordId = linkedRework.id;
      }

      // Randomly mark some as resolved (40%)
      const isResolved = Math.random() < 0.4;

      await prisma.lessonLearned.create({
        data: {
          wbsStage: data.wbsStage as Prisma.InputJsonValue,
          qcRecordId: qcRecordId,
          title: data.title,
          description: data.description,
          rootCause: data.rootCause,
          correctiveAction: data.correctiveAction,
          preventiveAction: data.preventiveAction,
          severity: data.severity as Prisma.InputJsonValue,
          occurredAt: data.occurredAt,
          isResolved,
          resolvedAt: isResolved ? new Date() : null,
          createdById,
        },
      });
      created++;
    } catch (error) {
      console.error(`Failed to create lesson: ${data.title}`, error);
    }
  }

  console.log(`Lesson Learned records created: ${created}`);

  // Print summary by severity
  const bySeverity = await prisma.lessonLearned.groupBy({
    by: ["severity"],
    _count: true,
  });
  console.log("\nBy severity:");
  for (const row of bySeverity) {
    console.log(`  ${row.severity}: ${row._count}`);
  }

  // Print summary by resolved status
  const byResolved = await prisma.lessonLearned.groupBy({
    by: ["isResolved"],
    _count: true,
  });
  console.log("\nBy status:");
  for (const row of byResolved) {
    console.log(`  ${row.isResolved ? "Resolved" : "Unresolved"}: ${row._count}`);
  }

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
