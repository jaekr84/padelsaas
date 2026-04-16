import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  uuid,
  pgEnum,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

// --- Auth.js Tables ---

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  password: text("password"),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// --- SaaS / Padel Tables ---

export const tenants = pgTable("tenant", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly identifier
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const centers = pgTable("center", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  website: text("website"),
  logoUrl: text("logo_url"),
  amenities: jsonb("amenities").default({}),
  openingHours: jsonb("opening_hours").default({}),
  openTime: text("open_time").default("08:00").notNull(),
  closeTime: text("close_time").default("23:00").notNull(),
  courtsCount: integer("courts_count").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courts = pgTable("court", {
  id: uuid("id").defaultRandom().primaryKey(),
  centerId: uuid("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull().default("indoor"), // indoor, outdoor, etc.
  surface: text("surface").notNull().default("Césped Sintético"),
  isPanoramic: boolean("is_panoramic").default(false).notNull(),
  hasLighting: boolean("has_lighting").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookings = pgTable("booking", {
  id: uuid("id").defaultRandom().primaryKey(),
  courtId: uuid("court_id")
    .notNull()
    .references(() => courts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" }),
  guestName: text("guest_name"),
  price: integer("price"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relationships/Members (Many-to-Many between User and Tenant)
export const members = pgTable("member", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  centerId: uuid("center_id")
    .references(() => centers.id, { onDelete: "set null" }),
  role: text("role").notNull().default("member"), // admin, member, owner
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Relations ---
import { relations } from "drizzle-orm";

export const membersRelations = relations(members, ({ one }) => ({
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [members.tenantId],
    references: [tenants.id],
  }),
  center: one(centers, {
    fields: [members.centerId],
    references: [centers.id],
  }),
}));

export const centersRelations = relations(centers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [centers.tenantId],
    references: [tenants.id],
  }),
  courts: many(courts),
}));

export const courtsRelations = relations(courts, ({ one, many }) => ({
  center: one(centers, {
    fields: [courts.centerId],
    references: [centers.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  court: one(courts, {
    fields: [bookings.courtId],
    references: [courts.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));
