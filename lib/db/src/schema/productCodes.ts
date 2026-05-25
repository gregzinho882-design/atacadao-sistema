import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productCodesTable = pgTable("product_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  productName: text("product_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductCodeSchema = createInsertSchema(productCodesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertProductCode = z.infer<typeof insertProductCodeSchema>;
export type ProductCode = typeof productCodesTable.$inferSelect;
