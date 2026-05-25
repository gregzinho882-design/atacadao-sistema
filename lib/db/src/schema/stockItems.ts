import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stockItemsTable = pgTable("stock_items", {
  id: serial("id").primaryKey(),
  palletNumber: text("pallet_number"),
  productName: text("product_name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  expiryDate: text("expiry_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStockItemSchema = createInsertSchema(stockItemsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStockItem = z.infer<typeof insertStockItemSchema>;
export type StockItem = typeof stockItemsTable.$inferSelect;
