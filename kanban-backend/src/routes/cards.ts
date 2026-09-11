import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { db } from "../db.js";
import { requireRole } from "../middleware/requireRole.js";
import { logActivity } from "../activityLog.js";
import { broadcastToWorkspace } from "../socket.js";

export const cardsRouter = Router();

interface Card {
  id: number;
  workspace_id: number;
  column_key: string;
  position: number;
  title: string;
  description: string | null;
  version: number;
  updated_at: string;
}

cardsRouter.post(
  "/workspaces/:workspaceId/cards",
  requireRole("collaborator"),
  (req, res) => {
    const { columnKey, title, description } = req.body;
    const workspaceId = req.params.workspaceId;

    if (!workspaceId || Array.isArray(workspaceId)) {
      res.status(400).json({ error: "Invalid workspaceId" });
      return;
    }

    if (!columnKey || !title) {
      res.status(400).json({ error: "columnKey and title are required" });
      return;
    }

    const maxPositionRow = db
      .prepare(
        `SELECT MAX(position) as maxPosition FROM cards WHERE workspace_id = ? AND column_key = ?`,
      )
      .get(workspaceId, columnKey) as { maxPosition: number | null };

    const newPosition = (maxPositionRow.maxPosition ?? 0) + 1;

    const result = db
      .prepare(
        `INSERT INTO cards (workspace_id, column_key, position, title, description, version)
       VALUES (?, ?, ?, ?, ?, 1)`,
      )
      .run(workspaceId, columnKey, newPosition, title, description ?? null);

    logActivity(
      workspaceId,
      req.userId!,
      "card_created",
      `Card "${title}" was created`,
    );

    broadcastToWorkspace(workspaceId, "card:created", {
      id: result.lastInsertRowid,
      workspaceId,
      columnKey,
      position: newPosition,
      title,
      description: description ?? null,
      version: 1,
    });

    res.status(201).json({
      id: result.lastInsertRowid,
      workspaceId,
      columnKey,
      position: newPosition,
      title,
      description: description ?? null,
      version: 1,
    });
  },
);

cardsRouter.get(
  "/workspaces/:workspaceId/board",
  requireRole("collaborator"),
  (req, res) => {
    const cards = db
      .prepare(
        `SELECT id, column_key, position, title, description, version
       FROM cards
       WHERE workspace_id = ?
       ORDER BY column_key, position`,
      )
      .all(req.params.workspaceId);

    res.json({ cards });
  },
);

function loadCardWorkspace(req: Request, res: Response, next: NextFunction) {
  const card = db
    .prepare(`SELECT workspace_id FROM cards WHERE id = ?`)
    .get(req.params.id) as { workspace_id: number } | undefined;

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  req.params.workspaceId = String(card.workspace_id);
  next();
}

cardsRouter.patch(
  "/cards/:id/move",
  loadCardWorkspace,
  requireRole("collaborator"),
  (req, res) => {
    const { toColumn, toPosition, expectedVersion } = req.body;
    const cardId = req.params.id;

    if (
      !toColumn ||
      toPosition === undefined ||
      expectedVersion === undefined
    ) {
      res.status(400).json({
        error: "toColumn, toPosition, and expectedVersion are required",
      });
      return;
    }

    const result = db
      .prepare(
        `UPDATE cards
       SET column_key = ?, position = ?, version = version + 1, updated_at = datetime('now')
       WHERE id = ? AND version = ?`,
      )
      .run(toColumn, toPosition, cardId, expectedVersion);

    if (result.changes === 0) {
      const current = db
        .prepare(`SELECT * FROM cards WHERE id = ?`)
        .get(cardId);
      if (!current) {
        res.status(404).json({ error: "Card not found" });
        return;
      }
      res.status(409).json({ error: "Version conflict", current });
      return;
    }

    const updated = db
      .prepare(`SELECT * FROM cards WHERE id = ?`)
      .get(cardId) as Card;

    logActivity(
      updated.workspace_id,
      req.userId!,
      "card_moved",
      `Moved "${updated.title}" to ${updated.column_key}`,
    );
    broadcastToWorkspace(updated.workspace_id, "card:moved", updated);
    res.json(updated);
  },
);

cardsRouter.patch(
  "/cards/:id",
  loadCardWorkspace,
  requireRole("collaborator"),
  (req, res) => {
    const { title, description, expectedVersion } = req.body;
    const cardId = req.params.id;

    if (!title || expectedVersion === undefined) {
      res.status(400).json({ error: "title and expectedVersion are required" });
      return;
    }

    const result = db
      .prepare(
        `UPDATE cards
       SET title = ?, description = ?, version = version + 1, updated_at = datetime('now')
       WHERE id = ? AND version = ?`,
      )
      .run(title, description ?? null, cardId, expectedVersion);

    if (result.changes === 0) {
      const current = db
        .prepare(`SELECT * FROM cards WHERE id = ?`)
        .get(cardId) as Card;
      res.status(409).json({ error: "Version conflict", current });
      return;
    }

    const updated = db
      .prepare(`SELECT * FROM cards WHERE id = ?`)
      .get(cardId) as Card;
    logActivity(
      updated.workspace_id,
      req.userId!,
      "card_edited",
      `Edited "${updated.title}"`,
    );
    broadcastToWorkspace(updated.workspace_id, "card:edited", updated);
    res.json(updated);
  },
);

cardsRouter.delete(
  "/cards/:id",
  loadCardWorkspace,
  requireRole("collaborator"),
  (req, res) => {
    const cardId = req.params.id;

    const card = db.prepare(`SELECT * FROM cards WHERE id = ?`).get(cardId) as
      | Card
      | undefined;

    if (!card) {
      res.status(404).json({ error: "Card not found" });
      return;
    }
    db.prepare(`DELETE FROM cards WHERE id = ?`).run(cardId);

    logActivity(
      card.workspace_id,
      req.userId!,
      "card_deleted",
      `Card "${card.title}" was deleted`,
    );
    broadcastToWorkspace(card.workspace_id, "card:deleted", { id: card.id });

    res.status(204).send();
  },
);
