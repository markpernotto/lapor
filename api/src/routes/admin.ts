import express from "express";
import {
  azureAuthMiddleware,
  requireAdmin,
} from "../middleware/auth";

const router = express.Router();

// Example protected route
router.get(
  "/protected",
  azureAuthMiddleware,
  requireAdmin,
  (req, res) => {
    const reqWithUser =
      req as unknown as Request & {
        user?: { id: string; email: string };
      };
    const user = reqWithUser.user;
    res.json({
      message: "You are an admin",
      user: user
        ? { id: user.id, email: user.email }
        : null,
    });
  },
);

export default router;
