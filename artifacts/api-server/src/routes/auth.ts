import { Router, type IRouter } from "express";
import { LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

const USERS: Record<string, string> = {
  Admin: "Adm1962",
  Gregory: "Greg01",
  Thales: "Thales02",
  Andrews: "Andrews03",
  Christian: "Christian04",
  Heryc: "Heryc05",
};

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  const validPassword = USERS[username];

  if (!validPassword || password !== validPassword) {
    res.status(401).json({ error: "Usuário ou senha inválidos" });
    return;
  }

  (req.session as any).user = { username };
  res.json({ username });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const user = (req.session as any).user;
  if (!user) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  res.json({ username: user.username });
});

export default router;
