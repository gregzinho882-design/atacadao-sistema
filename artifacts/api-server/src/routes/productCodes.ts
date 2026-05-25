import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, productCodesTable } from "@workspace/db";
import { CreateProductCodeBody, DeleteProductCodeParams, UpdateProductCodeParams } from "@workspace/api-zod";

const router: IRouter = Router();

const formatCode = (c: typeof productCodesTable.$inferSelect) => ({
  id: c.id,
  code: c.code,
  productName: c.productName,
  location: c.location ?? null,
  createdAt: c.createdAt.toISOString(),
});

router.get("/product-codes", async (req, res): Promise<void> => {
  const codes = await db
    .select()
    .from(productCodesTable)
    .orderBy(productCodesTable.code);
  res.json(codes.map(formatCode));
});

router.post("/product-codes", async (req, res): Promise<void> => {
  const parsed = CreateProductCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(productCodesTable)
    .values({
      code: parsed.data.code,
      productName: parsed.data.productName,
      location: parsed.data.location ?? null,
    })
    .returning();

  res.status(201).json(formatCode(created));
});

router.put("/product-codes/:id", async (req, res): Promise<void> => {
  const params = UpdateProductCodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateProductCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(productCodesTable)
    .set({
      code: parsed.data.code,
      productName: parsed.data.productName,
      location: parsed.data.location ?? null,
    })
    .where(eq(productCodesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Código não encontrado" });
    return;
  }

  res.json(formatCode(updated));
});

router.delete("/product-codes/:id", async (req, res): Promise<void> => {
  const params = DeleteProductCodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(productCodesTable)
    .where(eq(productCodesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Código não encontrado" });
    return;
  }

  res.json({ success: true });
});

export default router;
