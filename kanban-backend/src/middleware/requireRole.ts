import type { Request, Response, NextFunction } from "express";
import { db } from "../db.js";

export function requireRole(role: "owner" | "collaborator") {
  return (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = req.params.workspaceId;
    if (!workspaceId || !req.userId) {
      res.status(400).json({ error: "Missing workspaceId or user" });
      return;
    }

    const member = db
      .prepare(
        `SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?`,
      )
      .get(workspaceId, req.userId) as { role: string } | undefined;

    if (!member) {
      res.status(403).json({ error: "Not a member of this workspace" });
      return;
    }

    if (role === "owner" && member.role !== "owner") {
      res.status(403).json({ error: "Owner role required" });
      return;
    }

    next();
  };
}
