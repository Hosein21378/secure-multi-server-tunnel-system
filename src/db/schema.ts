import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  integer,
  doublePrecision,
  timestamp,
} from "drizzle-orm/pg-core";

export const serverRoleEnum = pgEnum("server_role", ["entry", "relay", "exit"]);
export const nodeStatusEnum = pgEnum("node_status", ["online", "offline", "degraded"]);
export const tunnelStatusEnum = pgEnum("tunnel_status", ["active", "paused", "error"]);
export const jobStatusEnum = pgEnum("job_status", ["running", "success", "failed"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 128 }).notNull().default("مدیر سیستم"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  country: varchar("country", { length: 64 }).notNull(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  city: varchar("city", { length: 64 }).notNull(),
  ip: varchar("ip", { length: 64 }).notNull(),
  role: serverRoleEnum("role").notNull().default("exit"),
  status: nodeStatusEnum("status").notNull().default("online"),
  latency: integer("latency").notNull().default(42),
  load: integer("load").notNull().default(20),
  agentVersion: varchar("agent_version", { length: 32 }).notNull().default("2.3.9"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tunnels = pgTable("tunnels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  protocol: varchar("protocol", { length: 32 }).notNull().default("hysteria2"),
  entryServerId: integer("entry_server_id").references(() => servers.id, { onDelete: "set null" }),
  exitServerId: integer("exit_server_id").references(() => servers.id, { onDelete: "set null" }),
  port: integer("port").notNull().default(443),
  encryption: varchar("encryption", { length: 64 }).notNull().default("AES-256-GCM"),
  mtu: integer("mtu").notNull().default(1420),
  status: tunnelStatusEnum("status").notNull().default("active"),
  latency: integer("latency").notNull().default(28),
  throughput: integer("throughput").notNull().default(900),
  trafficGb: doublePrecision("traffic_gb").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const releases = pgTable("releases", {
  id: serial("id").primaryKey(),
  version: varchar("version", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 180 }).notNull(),
  notes: text("notes").notNull().default(""),
  sizeMb: integer("size_mb").notNull().default(18),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
});

export const updateJobs = pgTable("update_jobs", {
  id: serial("id").primaryKey(),
  version: varchar("version", { length: 32 }).notNull(),
  status: jobStatusEnum("status").notNull().default("running"),
  progress: integer("progress").notNull().default(0),
  log: text("log").notNull().default(""),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export const settings = pgTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull().default(""),
});

export type ServerRow = typeof servers.$inferSelect;
export type TunnelRow = typeof tunnels.$inferSelect;
export type ReleaseRow = typeof releases.$inferSelect;
export type UpdateJobRow = typeof updateJobs.$inferSelect;
export type UserRow = typeof users.$inferSelect;
