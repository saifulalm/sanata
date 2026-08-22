import { prisma } from "@/lib/prisma";

export async function recordAudit(params: {
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      meta: params.meta ? JSON.stringify(params.meta) : undefined,
    },
  });
}
