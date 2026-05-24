import { and, desc, eq } from "drizzle-orm";

import type { Db } from "@portal/db";
import {
  agentProfileConfigs,
  agentProfileManifests,
  agentProfileMcpServers,
  agentProfilePolicyRules,
  agentProfileSkills,
  agentProfileTemplates,
  agentProfiles,
} from "@portal/db";

export class ProfileRepository {
  async listProfiles(db: Db, workspaceId: string) {
    return db
      .select()
      .from(agentProfiles)
      .where(eq(agentProfiles.workspaceId, workspaceId))
      .orderBy(desc(agentProfiles.createdAt));
  }

  async getProfile(db: Db, profileId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(agentProfiles)
      .where(
        and(
          eq(agentProfiles.id, profileId),
          eq(agentProfiles.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async createProfile(db: Db, data: typeof agentProfiles.$inferInsert) {
    const [row] = await db.insert(agentProfiles).values(data).returning();
    return row!;
  }

  async updateProfile(
    db: Db,
    profileId: string,
    workspaceId: string,
    patch: Partial<typeof agentProfiles.$inferInsert>,
  ) {
    const [row] = await db
      .update(agentProfiles)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(
          eq(agentProfiles.id, profileId),
          eq(agentProfiles.workspaceId, workspaceId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async deleteProfile(db: Db, profileId: string, workspaceId: string) {
    const [row] = await db
      .delete(agentProfiles)
      .where(
        and(
          eq(agentProfiles.id, profileId),
          eq(agentProfiles.workspaceId, workspaceId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async listTemplates(db: Db, workspaceId: string) {
    return db
      .select()
      .from(agentProfileTemplates)
      .where(eq(agentProfileTemplates.workspaceId, workspaceId))
      .orderBy(desc(agentProfileTemplates.createdAt));
  }

  async getTemplate(db: Db, templateId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(agentProfileTemplates)
      .where(
        and(
          eq(agentProfileTemplates.id, templateId),
          eq(agentProfileTemplates.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async createTemplate(
    db: Db,
    data: typeof agentProfileTemplates.$inferInsert,
  ) {
    const [row] = await db.insert(agentProfileTemplates).values(data).returning();
    return row!;
  }

  async publishTemplate(
    db: Db,
    templateId: string,
    workspaceId: string,
  ) {
    const [row] = await db
      .update(agentProfileTemplates)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(agentProfileTemplates.id, templateId),
          eq(agentProfileTemplates.workspaceId, workspaceId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async listConfigs(db: Db, profileId: string, workspaceId: string) {
    return db
      .select()
      .from(agentProfileConfigs)
      .where(
        and(
          eq(agentProfileConfigs.profileId, profileId),
          eq(agentProfileConfigs.workspaceId, workspaceId),
        ),
      );
  }

  async upsertConfig(
    db: Db,
    data: typeof agentProfileConfigs.$inferInsert,
  ) {
    const existing = await db
      .select()
      .from(agentProfileConfigs)
      .where(
        and(
          eq(agentProfileConfigs.profileId, data.profileId),
          eq(agentProfileConfigs.workspaceId, data.workspaceId),
          eq(agentProfileConfigs.configKey, data.configKey),
        ),
      )
      .limit(1);

    if (existing[0]) {
      const [row] = await db
        .update(agentProfileConfigs)
        .set({
          configValue: data.configValue,
          updatedAt: new Date(),
        })
        .where(eq(agentProfileConfigs.id, existing[0].id))
        .returning();
      return row!;
    }

    const [row] = await db.insert(agentProfileConfigs).values(data).returning();
    return row!;
  }

  async getLatestManifest(db: Db, profileId: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(agentProfileManifests)
      .where(
        and(
          eq(agentProfileManifests.profileId, profileId),
          eq(agentProfileManifests.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(agentProfileManifests.version))
      .limit(1);
    return row ?? null;
  }

  async saveManifest(
    db: Db,
    input: {
      profileId: string;
      workspaceId: string;
      manifest: Record<string, unknown>;
      version: number;
    },
  ) {
    const existing = await this.getLatestManifest(
      db,
      input.profileId,
      input.workspaceId,
    );

    if (existing) {
      const [row] = await db
        .update(agentProfileManifests)
        .set({
          manifest: input.manifest,
          version: input.version,
          updatedAt: new Date(),
        })
        .where(eq(agentProfileManifests.id, existing.id))
        .returning();
      return row!;
    }

    const [row] = await db
      .insert(agentProfileManifests)
      .values({
        profileId: input.profileId,
        workspaceId: input.workspaceId,
        manifest: input.manifest,
        version: input.version,
      })
      .returning();
    return row!;
  }

  async listProfileSkills(db: Db, profileId: string, workspaceId: string) {
    return db
      .select()
      .from(agentProfileSkills)
      .where(
        and(
          eq(agentProfileSkills.profileId, profileId),
          eq(agentProfileSkills.workspaceId, workspaceId),
        ),
      );
  }

  async listProfileMcpServers(db: Db, profileId: string, workspaceId: string) {
    return db
      .select()
      .from(agentProfileMcpServers)
      .where(
        and(
          eq(agentProfileMcpServers.profileId, profileId),
          eq(agentProfileMcpServers.workspaceId, workspaceId),
        ),
      );
  }

  async listProfilePolicyRules(db: Db, profileId: string, workspaceId: string) {
    return db
      .select()
      .from(agentProfilePolicyRules)
      .where(
        and(
          eq(agentProfilePolicyRules.profileId, profileId),
          eq(agentProfilePolicyRules.workspaceId, workspaceId),
        ),
      );
  }
}
