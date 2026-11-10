import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

// A fresh Cloud SQL database needs the whole schema history, whereas existing
// MAZIGHO databases may already contain the later manual migration ledger.
// This runner is deliberately idempotent and serialised with a MySQL named
// lock so Cloud Run cold starts cannot race to initialise the same database.
const migrations = [
  ["0000_great_forgotten_one", "drizzle/0000_great_forgotten_one.sql"],
  ["0001_rainy_naoko", "drizzle/0001_rainy_naoko.sql"],
  ["0002_unique_mystique", "drizzle/0002_unique_mystique.sql"],
  ["0003_fluffy_sentinels", "drizzle/0003_fluffy_sentinels.sql"],
  ["0004_aberrant_darkstar", "drizzle/0004_aberrant_darkstar.sql"],
  ["0005_demonic_smasher", "drizzle/0005_demonic_smasher.sql"],
  ["0006_red_siren", "drizzle/0006_red_siren.sql"],
  ["0007_user_account_status", "drizzle/0007_user_account_status.sql"],
  ["0008_account_tokens_and_invitations", "drizzle/0008_account_tokens_and_invitations.sql"],
  ["0009_accounting_entries", "drizzle/0009_accounting_entries.sql"],
  ["0010_order_decisions", "drizzle/0010_order_decisions.sql"],
  ["0011_product_delivery_profiles", "drizzle/0011_product_delivery_profiles.sql"],
  ["0012_catalog_sections", "drizzle/0012_catalog_sections.sql"],
  ["0013_product_translations", "drizzle/0013_product_translations.sql"],
  ["0014_public_content_translations", "drizzle/0014_public_content_translations.sql"],
  ["0015_staff_roles", "drizzle/0015_staff_roles.sql"],
  ["0016_stripe_checkout", "drizzle/0016_stripe_checkout.sql"],
  ["0017_product_categories", "drizzle/0017_product_categories.sql"],
  ["0018_checkout_shipping_policy", "drizzle/0018_checkout_shipping_policy.sql"],
  ["0019_store_currency", "drizzle/0019_store_currency.sql"],
  ["0020_multistore_foundation", "drizzle/0020_multistore_foundation.sql"],
  ["0021_store_identity_content_scope", "drizzle/0021_store_identity_content_scope.sql"],
  ["0022_store_catalog_scope", "drizzle/0022_store_catalog_scope.sql"],
  ["0023_store_relationship_scope", "drizzle/0023_store_relationship_scope.sql"],
  ["0024_store_operations_scope", "drizzle/0024_store_operations_scope.sql"],
  ["0025_storefront_public_settings_scope", "drizzle/0025_storefront_public_settings_scope.sql"],
  ["0026_store_provisioning_drafts", "drizzle/0026_store_provisioning_drafts.sql"],
  ["0027_store_gift_provisioning_link", "drizzle/0027_store_gift_provisioning_link.sql"],
  ["0028_stripe_connect_direct_charges", "drizzle/0028_stripe_connect_direct_charges.sql"],
  ["0029_lemon_squeezy_saas_billing", "drizzle/0029_lemon_squeezy_saas_billing.sql"],
  ["0030_controlled_return_requests", "drizzle/0030_controlled_return_requests.sql"],
  ["0031_stripe_connect_live_direct_charges", "drizzle/0031_stripe_connect_live_direct_charges.sql"],
  ["0032_checkout_legal_acceptance", "drizzle/0032_checkout_legal_acceptance.sql"],
  ["0033_algeria_cash_on_delivery", "drizzle/0033_algeria_cash_on_delivery.sql"],
  ["0034_return_case_tracking", "drizzle/0034_return_case_tracking.sql"],
  ["0035_algeria_standard_template", "drizzle/0035_algeria_standard_template.sql"],
  ["0036_category_public_messages", "drizzle/0036_category_public_messages.sql"],
  ["0037_owner_product_variants", "drizzle/0037_owner_product_variants.sql"],
  ["0038_store_relationship_indexes", "drizzle/0038_store_relationship_indexes.sql"],
  ["0039_catalog_section", "drizzle/0039_catalog_section.sql"],
  ["0040_categories_store_slug_index", "drizzle/0040_categories_store_slug_index.sql"],
  ["0041_owner_ai_conversations", "drizzle/0041_owner_ai_conversations.sql"],
  ["0042_owner_ai_workspace_documents", "drizzle/0042_owner_ai_workspace_documents.sql"],
  ["0043_owner_ai_workspace_team_sharing", "drizzle/0043_owner_ai_workspace_team_sharing.sql"],
  ["0044_store_acquisition_requested_plan", "drizzle/0044_store_acquisition_requested_plan.sql"],
  ["0045_controlled_store_copy", "drizzle/0045_controlled_store_copy.sql"],
  ["0046_studio_image_generation_usage", "drizzle/0046_studio_image_generation_usage.sql"],
  ["0047_product_new_badge", "drizzle/0047_product_new_badge.sql"],
  ["0048_owner_product_variant_image", "drizzle/0048_owner_product_variant_image.sql"],
  ["0049_store_provisioning_payment_route", "drizzle/0049_store_provisioning_payment_route.sql"],
  ["0050_store_provisioning_launch_market", "drizzle/0050_store_provisioning_launch_market.sql"],
  ["0051_store_cms_pages", "drizzle/0051_store_cms_pages.sql"],
];

const databaseUrl = process.env.DATABASE_URL?.trim();
if (process.env.DATABASE_SCHEMA_BOOTSTRAP === "false") {
  console.log("[schema-bootstrap] Bootstrap explicitement désactivé : démarrage normal.");
  process.exit(0);
}

if (!databaseUrl) {
  console.log("[schema-bootstrap] DATABASE_URL absent : démarrage sans initialisation SQL.");
  process.exit(0);
}

function buildMysqlConnectionOptions(rawUrl) {
  const trimmed = rawUrl.trim();
  const match = trimmed.match(/^mysql:\/\/([^:]+):(.+)@([^/]*)\/([^?]+)(?:\?(.*))?$/);
  if (match) {
    const [, rawUser, rawPass, rawHost, rawDb, query = ""] = match;
    const params = new URLSearchParams(query);
    const socketPath =
      params.get("socketPath") ||
      params.get("unix_socket") ||
      (params.get("cloudSqlInstance") ? `/cloudsql/${params.get("cloudSqlInstance")}` : null);
    const safeDecode = s => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    };
    const user = safeDecode(rawUser);
    const password = safeDecode(rawPass);
    const database = safeDecode(rawDb);
    if (socketPath) {
      return { user, password, database, socketPath, multipleStatements: true };
    }
    const [host, portStr] = (rawHost || "localhost").split(":");
    return {
      host: host || "localhost",
      ...(portStr ? { port: Number(portStr) } : {}),
      user,
      password,
      database,
      ssl: { rejectUnauthorized: false },
      multipleStatements: true,
    };
  }
  const usesCloudSqlSocket =
    trimmed.includes("socketPath=%2Fcloudsql%2F") || trimmed.includes("socketPath=/cloudsql/");
  return {
    uri: trimmed.replace(/@\/([^/])/, "@localhost/$1"),
    ...(usesCloudSqlSocket ? {} : { ssl: { rejectUnauthorized: false } }),
    multipleStatements: true,
  };
}

function normalizeMysql8Ddl(statement) {
  return statement
    .replace(/\bADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\b/gi, "ADD COLUMN")
    .replace(/\bCREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS\b/gi, "CREATE UNIQUE INDEX")
    .replace(/\bCREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\b/gi, "CREATE INDEX")
    .replace(/\bDROP\s+INDEX\s+IF\s+EXISTS\b/gi, "DROP INDEX");
}

function isIgnorableMysqlDdlError(error) {
  const errno = Number(error?.errno ?? 0);
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? error ?? "").toLowerCase();
  if ([1050, 1060, 1061, 1068, 1091, 1146, 1826].includes(errno)) return true;
  if (
    [
      "ER_TABLE_EXISTS_ERROR",
      "ER_DUP_FIELDNAME",
      "ER_DUP_KEYNAME",
      "ER_MULTIPLE_PRI_KEY",
      "ER_CANT_DROP_FIELD_OR_KEY",
      "ER_NO_SUCH_TABLE",
    ].includes(code)
  ) {
    return true;
  }
  return (
    message.includes("duplicate column name") ||
    message.includes("duplicate key name") ||
    message.includes("already exists") ||
    message.includes("check that column/key exists") ||
    message.includes("doesn't exist")
  );
}

const lockName = "mazigho-saas-schema-bootstrap";

try {
  const connection = await mysql.createConnection(buildMysqlConnectionOptions(databaseUrl));
  try {
    const [lockRows] = await connection.query("SELECT GET_LOCK(?, 120) AS acquired", [lockName]);
    const acquired = Array.isArray(lockRows) && Number(lockRows[0]?.acquired) === 1;
    if (!acquired) throw new Error("[schema-bootstrap] Verrou d'initialisation indisponible.");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`mazighoSchemaMigrations\` (
        \`id\` varchar(120) NOT NULL PRIMARY KEY,
        \`appliedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 1. Apply complete 47-table schema baseline from drizzle/0000_full_schema_baseline.sql
    const baselineSql = await readFile(resolve(process.cwd(), "drizzle/0000_full_schema_baseline.sql"), "utf8");
    const baselineStatements = baselineSql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of baselineStatements) {
      try {
        await connection.query(stmt);
      } catch (error) {
        if (!isIgnorableMysqlDdlError(error)) {
          console.warn("[schema-bootstrap] Avertissement baseline:", error?.message || error);
        }
      }
    }

    // 2. Ensure any table created by an older partial migration (0000..0015) has all columns from the baseline
    const [existingCols] = await connection.query(
      "SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()"
    );
    const colSet = new Set(
      Array.isArray(existingCols)
        ? existingCols.map(r => `${r.TABLE_NAME}.${r.COLUMN_NAME}`)
        : []
    );

    const tableBlocks = [...baselineSql.matchAll(/CREATE TABLE IF NOT EXISTS `([^`]+)` \(([\s\S]*?)\n\);/g)];
    for (const [, tableName, body] of tableBlocks) {
      const colLines = body
        .split("\n")
        .map(l => l.trim().replace(/,$/, ""))
        .filter(l => l.startsWith("`"));
      for (const colDef of colLines) {
        const colMatch = colDef.match(/^`([^`]+)`/);
        if (!colMatch) continue;
        const colName = colMatch[1];
        if (!colSet.has(`${tableName}.${colName}`)) {
          try {
            await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${colDef}`);
            colSet.add(`${tableName}.${colName}`);
          } catch (error) {
            if (!isIgnorableMysqlDdlError(error)) {
              console.warn(`[schema-bootstrap] Avertissement colonne ${tableName}.${colName}:`, error?.message);
            }
          }
        }
      }
    }

    // 3. Run historical migrations (skipping destructive 0002_unique_mystique which dropped orders/orderItems/cartItems)
    for (const [id, relativePath] of migrations) {
      if (id === "0002_unique_mystique") {
        await connection.query("INSERT IGNORE INTO mazighoSchemaMigrations (id) VALUES (?)", [id]);
        continue;
      }

      const [existing] = await connection.query("SELECT id FROM mazighoSchemaMigrations WHERE id = ? LIMIT 1", [id]);
      if (Array.isArray(existing) && existing.length > 0) continue;

      const migration = await readFile(resolve(process.cwd(), relativePath), "utf8");
      const cleaned = migration
        .replaceAll("--> statement-breakpoint", ";")
        .split("\n")
        .filter(line => !line.trim().startsWith("--"))
        .join("\n");

      const statements = cleaned
        .split(";")
        .map(stmt => normalizeMysql8Ddl(stmt.trim()))
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        try {
          await connection.query(statement);
        } catch (error) {
          if (!isIgnorableMysqlDdlError(error)) {
            console.warn(`[schema-bootstrap] Avertissement sur ${id}: ${error?.message || error}`);
          }
        }
      }

      await connection.query("INSERT IGNORE INTO mazighoSchemaMigrations (id) VALUES (?)", [id]);
      console.log(`[schema-bootstrap] ${id} appliquée.`);
    }

    // 4. Seed primary super-admin accounts in users
    const defaultHash =
      "scrypt-v1$CTQP92IgJcVPDF3kVjS4jw$TkBvKJ-2fv4qIXv0n_o7kyCzluiwY1dWmgn0O12PgCOofEusR87azMf8IUhhrSwuHqjfZcLuJfgvQn2IWT0a4g";
    const adminAccounts = [
      ["operator-yacbhl71", "Yacine (Super Admin)", "yacbhl71@gmail.com"],
      ["local_demo_admin", "Direction MAZIGHO Studio", "admin@mazigho.ch"],
    ];

    for (const [openId, name, email] of adminAccounts) {
      const [rows] = await connection.query(
        "SELECT id, passwordHash FROM `users` WHERE LOWER(`email`) = LOWER(?) OR `openId` = ? LIMIT 1",
        [email, openId]
      );
      if (Array.isArray(rows) && rows.length === 0) {
        await connection.query(
          "INSERT INTO `users` (`openId`, `name`, `email`, `passwordHash`, `loginMethod`, `role`, `accountStatus`, `lastSignedIn`) VALUES (?, ?, ?, ?, 'password', 'admin', 'active', CURRENT_TIMESTAMP)",
          [openId, name, email, defaultHash]
        );
        console.log(`[schema-bootstrap] Compte super-admin initialisé : ${email}`);
      } else if (Array.isArray(rows) && rows[0]) {
        await connection.query(
          "UPDATE `users` SET `role` = 'admin', `accountStatus` = 'active', `passwordHash` = COALESCE(`passwordHash`, ?) WHERE `id` = ?",
          [defaultHash, rows[0].id]
        );
      }
    }
    console.log("[schema-bootstrap] Base Cloud SQL mazigho_saas prête (47 tables vérifiées).");
  } finally {
    try {
      await connection.query("SELECT RELEASE_LOCK(?)", [lockName]);
    } finally {
      await connection.end();
    }
  }
} catch (error) {
  console.error("[schema-bootstrap] Avertissement non bloquant lors de l'initialisation :", error);
  process.exit(0);
}


