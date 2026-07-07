import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import authRouter from "./auth";
import usersRouter from "./users";
import subscriptionsRouter from "./subscriptions";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/ai", aiRouter);
router.use("/subscriptions", subscriptionsRouter);
router.use("/admin", adminRouter);

export default router;
