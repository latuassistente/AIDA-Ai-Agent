import type { ProjectBrain } from "./project-brain";

export interface ProjectBrainStore {
  save(brain: ProjectBrain): Promise<void>;
  get(projectId: string, tenantId: string): Promise<ProjectBrain | undefined>;
}

export class InMemoryProjectBrainStore implements ProjectBrainStore {
  private readonly records = new Map<string, ProjectBrain>();

  async save(brain: ProjectBrain): Promise<void> {
    this.records.set(`${brain.tenantId}:${brain.projectId}`, brain);
  }

  async get(projectId: string, tenantId: string): Promise<ProjectBrain | undefined> {
    return this.records.get(`${tenantId}:${projectId}`);
  }
}
