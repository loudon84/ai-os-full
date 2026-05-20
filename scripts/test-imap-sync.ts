/**
 * Test script: Connect to IMAP for admin@portal's email account and fetch messages.
 *
 * Usage: npx tsx scripts/test-imap-sync.ts
 *
 * Reads email account from DB → decrypts password → connects IMAP → searches SINCE 30 days → fetches & parses messages.
 */
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: new URL("../.env", import.meta.url).pathname });

import { createDb } from "@portal/db";
import { emailAccounts, users } from "@portal/db";
import { eq } from "drizzle-orm";

import { CredentialCryptoService } from "@portal/server/services/email/credential-crypto.service.js";
import { ImapProvider } from "@portal/server/services/email/providers/imap-provider.js";
import type { ReceiveConfig, FetchedMessage } from "@portal/server/services/email/providers/mailbox-provider.js";

const DB_URL = process.env.DATABASE_URL!;
const ENCRYPTION_KEY = process.env.EMAIL_CREDENTIAL_ENCRYPTION_KEY ?? "0".repeat(64);

async function main() {
  const db = createDb(DB_URL);
  const crypto = new CredentialCryptoService(ENCRYPTION_KEY);

  // 1. Find admin@portal user
  const adminRows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, "admin@portal"))
    .limit(1);

  if (adminRows.length === 0) {
    console.error("❌ User admin@portal not found in database");
    process.exit(1);
  }
  const adminUser = adminRows[0];
  console.log(`✅ Found user: ${adminUser.email} (id: ${adminUser.id})`);

  // 2. Find email account
  const accountRows = await db
    .select()
    .from(emailAccounts)
    .where(eq(emailAccounts.userId, adminUser.id))
    .limit(1);

  if (accountRows.length === 0) {
    console.error("❌ No email account configured for admin@portal");
    process.exit(1);
  }
  const account = accountRows[0];

  console.log("\n📧 Email Account Configuration:");
  console.log(`   Email:        ${account.emailAddress}`);
  console.log(`   Display Name: ${account.displayName ?? "(none)"}`);
  console.log(`   Provider:     ${account.providerType}`);
  console.log(`   Protocol:     ${account.receiveProtocol}`);
  console.log(`   IMAP Host:    ${account.imapHost}`);
  console.log(`   IMAP Port:    ${account.imapPort}`);
  console.log(`   IMAP Secure:  ${account.imapSecure}`);
  console.log(`   SMTP Host:    ${account.smtpHost}`);
  console.log(`   SMTP Port:    ${account.smtpPort}`);
  console.log(`   Username:     ${account.username}`);
  console.log(`   Status:       ${account.status}`);
  console.log(`   Last Sync:    ${account.lastSyncAt?.toISOString() ?? "never"}`);
  console.log(`   Last Error:   ${account.lastSyncError ?? "none"}`);
  console.log(`   Sync Enabled: ${account.syncEnabled}`);

  // 3. Decrypt password
  const password = crypto.decrypt({
    encrypted: account.encryptedPassword,
    iv: account.passwordIv,
    authTag: account.passwordAuthTag,
  });
  console.log(`   Password:     ${"*".repeat(Math.max(4, password.length))}`);

  // 4. Build ReceiveConfig
  const receiveConfig: ReceiveConfig = {
    protocol: account.receiveProtocol as "imap" | "pop3",
    host: account.receiveProtocol === "imap" ? account.imapHost! : account.pop3Host!,
    port: account.receiveProtocol === "imap" ? account.imapPort! : account.pop3Port!,
    secure: account.receiveProtocol === "imap" ? account.imapSecure : account.pop3Secure,
    username: account.username,
    password,
  };

  console.log("\n🔌 Connecting to IMAP server...");
  const provider = new ImapProvider();

  try {
    await provider.connect(receiveConfig);
    console.log("✅ IMAP connection successful!");
  } catch (err) {
    console.error("❌ IMAP connection failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  // 5. List folders
  try {
    const folders = await provider.listFolders();
    console.log(`\n📁 Folders (${folders.length}):`);
    for (const f of folders) {
      console.log(`   ${f.path}${f.specialUse ? ` [${f.specialUse}]` : ""}`);
    }
  } catch (err) {
    console.error("⚠️  Failed to list folders:", err instanceof Error ? err.message : err);
  }

  // 6. Fetch messages (since 30 days ago)
  const since = new Date();
  since.setDate(since.getDate() - 30);
  console.log(`\n📬 Fetching messages since ${since.toISOString()}...`);

  try {
    const messages: FetchedMessage[] = await provider.fetchNewMessages(since);
    console.log(`✅ Fetched ${messages.length} messages\n`);

    // Show summary
    const byFolder = new Map<string, number>();
    for (const m of messages) {
      byFolder.set(m.folderPath, (byFolder.get(m.folderPath) ?? 0) + 1);
    }
    console.log("📊 Messages by folder:");
    for (const [folder, count] of byFolder) {
      console.log(`   ${folder}: ${count}`);
    }

    // Show first 5 messages
    console.log("\n📨 Latest messages (up to 5):");
    const shown = messages.slice(0, 5);
    for (const m of shown) {
      console.log(`   ---`);
      console.log(`   UID:     ${m.uid}`);
      console.log(`   From:    ${m.from?.name ?? ""} <${m.from?.address ?? ""}>`);
      console.log(`   To:      ${m.to.map((a) => a.address).join(", ")}`);
      console.log(`   Subject: ${m.subject ?? "(no subject)"}`);
      console.log(`   Date:    ${m.date?.toISOString() ?? "unknown"}`);
      console.log(`   Folder:  ${m.folderPath}`);
      console.log(`   Flags:   ${m.flags.join(", ") || "(none)"}`);
      console.log(`   Attach:  ${m.attachments.length}`);
      if (m.textBody) {
        const preview = m.textBody.slice(0, 120).replace(/\r?\n/g, " ");
        console.log(`   Preview: ${preview}...`);
      }
    }

    if (messages.length > 5) {
      console.log(`\n   ... and ${messages.length - 5} more messages`);
    }

    console.log(`\n✅ IMAP sync test PASSED — ${messages.length} messages retrieved from ${account.imapHost}`);
  } catch (err) {
    console.error("❌ Failed to fetch messages:", err instanceof Error ? err.message : err);
    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    }
  } finally {
    await provider.disconnect().catch(() => undefined);
    console.log("\n🔌 IMAP disconnected");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
