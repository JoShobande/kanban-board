import { Router } from "express";
import { db } from "../db.js";
import { requireRole } from "../middleware/requireRole.js";

export const workspacesRouter = Router();

const createWorkspace = db.transaction((name: string, userId: string) => {
  const insertWorkspace = db.prepare(
    `INSERT INTO workspaces (name) VALUES (?)`,
  );
  const result = insertWorkspace.run(name);
  const workspaceId = result.lastInsertRowid;

  const insertMember = db.prepare(
    `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')`,
  );
  insertMember.run(workspaceId, userId);

  return { id: workspaceId, name };
});

workspacesRouter.post("/", (req, res) => {
  const { name } = req.body;
  const userId = req.userId!;

  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const workspace = createWorkspace(name, userId);
  res.status(201).json(workspace);
});

// GET /api/workspaces/:workspaceId/members — any member can view
workspacesRouter.get(
  "/:workspaceId/members",
  requireRole("collaborator"),
  (req, res) => {
    const members = db
      .prepare(
        `SELECT user_id, role, created_at FROM workspace_members WHERE workspace_id = ?`,
      )
      .all(req.params.workspaceId);
    res.json(members);
  },
);

// POST /api/workspaces/:workspaceId/members — owner-only
workspacesRouter.post(
  "/:workspaceId/members",
  requireRole("owner"),
  (req, res) => {
    const { userId: newUserId, role } = req.body;

    if (!newUserId || (role !== "owner" && role !== "collaborator")) {
      res.status(400).json({ error: "userId and valid role are required" });
      return;
    }

    try {
      db.prepare(
        `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)`,
      ).run(req.params.workspaceId, newUserId, role);
      res
        .status(201)
        .json({ workspaceId: req.params.workspaceId, userId: newUserId, role });
    } catch (err) {
      // UNIQUE constraint fires if this user is already a member
      res
        .status(409)
        .json({ error: "User is already a member of this workspace" });
    }
  },
);

// DELETE /api/workspaces/:workspaceId/members/:userId — owner-only
workspacesRouter.delete(
  "/:workspaceId/members/:userId",
  requireRole("owner"),
  (req, res) => {
    const result = db
      .prepare(
        `DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?`,
      )
      .run(req.params.workspaceId, req.params.userId);

    if (result.changes === 0) {
      res.status(404).json({ error: "Member not found" });
      return;
    }
    res.status(204).send();
  },
);
