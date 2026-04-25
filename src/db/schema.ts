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
  decimal,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";
import { relations } from "drizzle-orm";

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
  defaultPrice30: integer("default_price_30").default(0).notNull(),
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
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, partially_paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pricingSchedules = pgTable("pricing_schedule", {
  id: uuid("id").defaultRandom().primaryKey(),
  centerId: uuid("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  startTime: text("start_time").notNull(), // "HH:mm"
  endTime: text("end_time").notNull(),   // "HH:mm"
  daysOfWeek: jsonb("days_of_week").$type<number[]>().notNull(), // [0,1,2,3,4,5,6] (0=Sun)
  priority: integer("priority").default(1).notNull(),
  price: integer("price").notNull(), // Price per 30 mins
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

// --- Kiosk / Billing Tables ---

export const productCategories = pgTable("product_category", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const suppliers = pgTable("supplier", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("product", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .references(() => productCategories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku"), // Barcode / Internal SKU
  buyPrice: integer("buy_price").default(0).notNull(), // Cost price
  sellPrice: integer("sell_price").default(0).notNull(), // Sale price
  minStock: integer("min_stock").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productStock = pgTable("product_stock", {
  id: uuid("id").defaultRandom().primaryKey(),
  centerId: uuid("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  stock: integer("stock").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inventoryTransactions = pgTable("inventory_transaction", {
  id: uuid("id").defaultRandom().primaryKey(),
  centerId: uuid("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  type: text("type").notNull(), // purchase, sale, adjustment, transfer
  quantity: integer("quantity").notNull(), // can be negative for sales
  reason: text("reason"), // "New purchase", "Manual adjustment", etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cashRegisters = pgTable("cash_register", {
  id: uuid("id").defaultRandom().primaryKey(),
  centerId: uuid("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  openingAmount: integer("opening_amount").default(0).notNull(),
  closingAmount: integer("closing_amount"),
  status: text("status").default("open").notNull(), // open, closed
  notes: text("notes"),
});

// --- VENTAS (POS) ---

export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleNumber: text("sale_number").unique(),
  customerName: text("customer_name").default("Consumidor Final"),
  paymentMethod: text("payment_method").notNull(), // Efectivo, Transferencia, Tarjeta, etc.
  terminalId: text("terminal_id"), // Para identificar desde qué caja se vendió
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  charge: decimal("charge", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  centerId: uuid("center_id").references(() => centers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: text("user_id"), // Vendedor
  cashRegisterId: uuid("cash_register_id").references(() => cashRegisters.id),
});

export const saleItems = pgTable("sale_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleId: uuid("sale_id").references(() => sales.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id),
  variantId: uuid("variant_id"), // Si aplica
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  bookingId: uuid("booking_id").references(() => bookings.id),
  categoryId: uuid("category_id").references(() => productCategories.id),
});

// --- PURCHASES ---

export const purchases = pgTable("purchase", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  centerId: uuid("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id")
    .references(() => suppliers.id, { onDelete: "set null" }),
  total: integer("total").notNull(),
  invoiceNumber: text("invoice_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseItems = pgTable("purchase_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  purchaseId: uuid("purchase_id")
    .notNull()
    .references(() => purchases.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  unitCost: integer("unit_cost").notNull(),
  subtotal: integer("subtotal").notNull(),
  expiryDate: timestamp("expiry_date"),
  batchNumber: text("batch_number"),
});

export const productBatches = pgTable("product_batch", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  centerId: uuid("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").notNull(),
  quantity: integer("quantity").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  batchNumber: text("batch_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- RELATIONS ---

export const membersRelations = relations(members, ({ one }) => ({
  user: one(users, { fields: [members.userId], references: [users.id] }),
  tenant: one(tenants, { fields: [members.tenantId], references: [tenants.id] }),
  center: one(centers, { fields: [members.centerId], references: [centers.id] }),
}));

export const centersRelations = relations(centers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [centers.tenantId], references: [tenants.id] }),
  courts: many(courts),
  pricingSchedules: many(pricingSchedules),
}));

export const courtsRelations = relations(courts, ({ one, many }) => ({
  center: one(centers, { fields: [courts.centerId], references: [centers.id] }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  court: one(courts, { fields: [bookings.courtId], references: [courts.id] }),
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
}));

export const pricingSchedulesRelations = relations(pricingSchedules, ({ one }) => ({
  center: one(centers, { fields: [pricingSchedules.centerId], references: [centers.id] }),
}));

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, { fields: [products.categoryId], references: [productCategories.id] }),
  stock: many(productStock),
  items: many(saleItems),
}));

export const productStockRelations = relations(productStock, ({ one }) => ({
  product: one(products, { fields: [productStock.productId], references: [products.id] }),
  center: one(centers, { fields: [productStock.centerId], references: [centers.id] }),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  center: one(centers, { fields: [sales.centerId], references: [centers.id] }),
  items: many(saleItems),
  cashRegister: one(cashRegisters, { fields: [sales.cashRegisterId], references: [cashRegisters.id] }),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  product: one(products, { fields: [saleItems.productId], references: [products.id] }),
  category: one(productCategories, { fields: [saleItems.categoryId], references: [productCategories.id] }),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [purchases.supplierId], references: [suppliers.id] }),
  center: one(centers, { fields: [purchases.centerId], references: [centers.id] }),
  items: many(purchaseItems),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, { fields: [purchaseItems.purchaseId], references: [purchases.id] }),
  product: one(products, { fields: [purchaseItems.productId], references: [products.id] }),
}));

export const productBatchesRelations = relations(productBatches, ({ one }) => ({
  product: one(products, { fields: [productBatches.productId], references: [products.id] }),
  center: one(centers, { fields: [productBatches.centerId], references: [centers.id] }),
}));
