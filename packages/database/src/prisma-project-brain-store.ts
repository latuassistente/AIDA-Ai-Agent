import type { PrismaClient } from "@prisma/client";
import type { ProjectBrain } from "../../crm/src/project-brain";
import type { ProjectBrainStore } from "../../crm/src/project-brain-store";

export class PrismaProjectBrainStore implements ProjectBrainStore {
  constructor(private readonly db: PrismaClient) {}

  async save(brain: ProjectBrain): Promise<void> {
    const result = await this.db.project.updateMany({
      where: { id: brain.projectId, tenantId: brain.tenantId, customerId: brain.customerId },
      data: { brain: brain as unknown as object, stage: brain.stage },
    });
    if (result.count !== 1) throw new Error("Project not found for this tenant/customer.");
  }

  async get(projectId: string, tenantId: string): Promise<ProjectBrain | undefined> {
    const project = await this.db.project.findFirst({
      where: { id: projectId, tenantId },
      select: { id: true, tenantId: true, customerId: true, brain: true, objective: true, stage: true },
    });
    if (!project) return undefined;
    if (project.brain && typeof project.brain === "object" && !Array.isArray(project.brain)) {
      return project.brain as unknown as ProjectBrain;
    }
    return {
      projectId: project.id,
      tenantId: project.tenantId,
      customerId: project.customerId,
      stage: project.stage as ProjectBrain["stage"],
      objective: project.objective,
      completed: [],
      missing: [],
      blockers: [],
      deadlines: [],
      kpis: {},
      timelineEventIds: [],
    };
  }
}
