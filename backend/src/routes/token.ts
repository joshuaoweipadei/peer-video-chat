import { Router, Request, Response } from "express";

const router = Router();

const TOKEN_EXPIRE_SECONDS = Number(3600);

router.get("/token", (req: Request, res: Response): void => {
  res.json({
    expiresIn: TOKEN_EXPIRE_SECONDS,
  });
});

export default router;
