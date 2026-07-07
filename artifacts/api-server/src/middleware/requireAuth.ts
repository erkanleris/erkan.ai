import { Request, Response, NextFunction } from "express";
import { getUserId } from "../lib/tokenStore";

export function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers["authorization"];
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = getTokenFromRequest(req);
  if (!token) { res.status(401).json({ error: "يجب تسجيل الدخول أولاً" }); return; }
  const userId = getUserId(token);
  if (!userId) { res.status(401).json({ error: "جلسة منتهية، سجّل الدخول مجدداً" }); return; }
  res.locals["userId"] = userId;
  res.locals["token"] = token;
  next();
}
