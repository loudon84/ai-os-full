import { and, desc, eq } from "drizzle-orm";

import type { Db } from "@portal/db";
import {
  skillInstallRecords,
  skillProfileBindings,
  skillPublishRecords,
  skillTemplateFiles,
  skillTemplateVersions,
  skillTemplates,
} from "@portal/db";

export class SkillRepository {
  async listTemplates(db: Db, workspaceId: string) {
    return db
      .select()
      .from(skillTemplates)
      .where(eq(skillTemplates.workspaceId, workspaceId))
      .orderBy(desc(skillTemplates.createdAt));
  }

  async getTemplate(db: Db, skillId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(skillTemplates)
      .where(
        and(eq(skillTemplates.id, skillId), eq(skillTemplates.workspaceId, workspaceId)),
      )
      .limit(1);
    return row ?? null;
  }

  async createTemplate(db: Db, data: typeof skillTemplates.$inferInsert) {
    const [row] = await db.insert(skillTemplates).values(data).returning();
    return row!;
  }

  async updateTemplate(
    db: Db,
    skillId: string,
    workspaceId: string,
    patch: Partial<typeof skillTemplates.$inferInsert>,
  ) {
    const [row] = await db
      .update(skillTemplates)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(eq(skillTemplates.id, skillId), eq(skillTemplates.workspaceId, workspaceId)),
      )
      .returning();
    return row ?? null;
  }

  async deleteTemplate(db: Db, skillId: string, workspaceId: string) {
    const [row] = await db
      .delete(skillTemplates)
      .where(
        and(eq(skillTemplates.id, skillId), eq(skillTemplates.workspaceId, workspaceId)),
      )
      .returning();
    return row ?? null;
  }

  async listVersions(db: Db, skillId: string, workspaceId: string) {
    return db
      .select()
      .from(skillTemplateVersions)
      .where(
        and(
          eq(skillTemplateVersions.skillId, skillId),
          eq(skillTemplateVersions.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(skillTemplateVersions.createdAt));
  }

  async getVersion(db: Db, versionId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(skillTemplateVersions)
      .where(
        and(
          eq(skillTemplateVersions.id, versionId),
          eq(skillTemplateVersions.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async countVersions(db: Db, skillId: string, workspaceId: string) {
    const rows = await this.listVersions(db, skillId, workspaceId);
    return rows.length;
  }

  async createVersion(
    db: Db,
    data: typeof skillTemplateVersions.$inferInsert,
    files: Array<{
      path: string;
      checksum: string;
      content_type: string;
    }>,
  ) {
    const [version] = await db
      .insert(skillTemplateVersions)
      .values(data)
      .returning();

    if (files.length > 0) {
      await db.insert(skillTemplateFiles).values(
        files.map((f) => ({
          versionId: version!.id,
          workspaceId: data.workspaceId,
          path: f.path,
          checksum: f.checksum,
          contentType: f.content_type,
        })),
      );
    }

    return version!;
  }

  async publishVersion(
    db: Db,
    versionId: string,
    skillId: string,
    workspaceId: string,
  ) {
    const [row] = await db
      .update(skillTemplateVersions)
      .set({ status: "published", publishedAt: new Date() })
      .where(
        and(
          eq(skillTemplateVersions.id, versionId),
          eq(skillTemplateVersions.skillId, skillId),
          eq(skillTemplateVersions.workspaceId, workspaceId),
        ),
      )
      .returning();

    if (row) {
      await db
        .update(skillTemplates)
        .set({ status: "published", updatedAt: new Date() })
        .where(
          and(eq(skillTemplates.id, skillId), eq(skillTemplates.workspaceId, workspaceId)),
        );
    }

    return row ?? null;
  }

  async listVersionFiles(db: Db, versionId: string, workspaceId: string) {
    return db
      .select()
      .from(skillTemplateFiles)
      .where(
        and(
          eq(skillTemplateFiles.versionId, versionId),
          eq(skillTemplateFiles.workspaceId, workspaceId),
        ),
      );
  }

  async getLatestPublishedVersion(db: Db, skillId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(skillTemplateVersions)
      .where(
        and(
          eq(skillTemplateVersions.skillId, skillId),
          eq(skillTemplateVersions.workspaceId, workspaceId),
          eq(skillTemplateVersions.status, "published"),
        ),
      )
      .orderBy(desc(skillTemplateVersions.publishedAt))
      .limit(1);
    return row ?? null;
  }

  async insertPublishRecord(
    db: Db,
    data: typeof skillPublishRecords.$inferInsert,
  ) {
    const [row] = await db.insert(skillPublishRecords).values(data).returning();
    return row!;
  }

  async insertInstallRecord(
    db: Db,
    data: typeof skillInstallRecords.$inferInsert,
  ) {
    const [row] = await db.insert(skillInstallRecords).values(data).returning();
    return row!;
  }

  async upsertProfileBinding(
    db: Db,
    data: typeof skillProfileBindings.$inferInsert,
  ) {
    const existing = await db
      .select()
      .from(skillProfileBindings)
      .where(
        and(
          eq(skillProfileBindings.skillId, data.skillId),
          eq(skillProfileBindings.profileId, data.profileId),
          eq(skillProfileBindings.workspaceId, data.workspaceId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      const [row] = await db
        .update(skillProfileBindings)
        .set({ enabled: data.enabled ?? true })
        .where(eq(skillProfileBindings.id, existing[0].id))
        .returning();
      return row!;
    }

    const [row] = await db.insert(skillProfileBindings).values(data).returning();
    return row!;
  }

  async listInstallRecords(db: Db, workspaceId: string) {
    return db
      .select()
      .from(skillInstallRecords)
      .where(eq(skillInstallRecords.workspaceId, workspaceId))
      .orderBy(desc(skillInstallRecords.createdAt));
  }
}
