import { Router, type Router as ExpressRouter } from "express";

export function healthRoutes(): ExpressRouter {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return router;
}
