import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, stockItemsTable, productCodesTable } from "@workspace/db";
import {
  CreateStockItemBody,
  UpdateStockItemParams,
  UpdateStockItemBody,
  DeleteStockItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const formatItem = (i: typeof stockItemsTable.$inferSelect) => ({
  id: i.id,
  palletNumber: i.palletNumber ?? null,
  productName: i.productName,
  description: i.description ?? null,
  location: i.location,
  expiryDate: i.expiryDate ?? null,
  createdAt: i.createdAt.toISOString(),
  updatedAt: i.updatedAt.toISOString(),
});

router.get("/stock-items/summary", async (req, res): Promise<void> => {
  const [{ count: totalItems }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(stockItemsTable);

  const [{ count: totalCodes }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productCodesTable);

  const locationBreakdown = await db
    .select({
      location: stockItemsTable.location,
      count: sql<number>`count(*)::int`,
    })
    .from(stockItemsTable)
    .groupBy(stockItemsTable.location)
    .orderBy(stockItemsTable.location);

  res.json({ totalItems, totalCodes, locationBreakdown });
});

router.get("/stock-items", async (req, res): Promise<void> => {
  const items = await db
    .select()
    .from(stockItemsTable)
    .orderBy(stockItemsTable.location, stockItemsTable.productName);
  res.json(items.map(formatItem));
});

router.post("/stock-items", async (req, res): Promise<void> => {
  const parsed = CreateStockItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(stockItemsTable)
    .values({
      palletNumber: parsed.data.palletNumber ?? null,
      productName: parsed.data.productName,
      description: parsed.data.description ?? null,
      location: parsed.data.location,
      expiryDate: parsed.data.expiryDate ?? null,
    })
    .returning();

  res.status(201).json(formatItem(created));
});

router.put("/stock-items/:id", async (req, res): Promise<void> => {
  const params = UpdateStockItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStockItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.palletNumber !== undefined) updateData.palletNumber = parsed.data.palletNumber || null;
  if (parsed.data.productName !== undefined) updateData.productName = parsed.data.productName;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description || null;
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
  if (parsed.data.expiryDate !== undefined) updateData.expiryDate = parsed.data.expiryDate || null;

  const [updated] = await db
    .update(stockItemsTable)
    .set(updateData)
    .where(eq(stockItemsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Item não encontrado" });
    return;
  }

  res.json(formatItem(updated));
});

router.delete("/stock-items/:id", async (req, res): Promise<void> => {
  const params = DeleteStockItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(stockItemsTable)
    .where(eq(stockItemsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Item não encontrado" });
    return;
  }

  res.json({ success: true });
});

export default router;
