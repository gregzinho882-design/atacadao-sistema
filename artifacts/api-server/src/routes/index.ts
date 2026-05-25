import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productCodesRouter from "./productCodes";
import stockItemsRouter from "./stockItems";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productCodesRouter);
router.use(stockItemsRouter);

export default router;
