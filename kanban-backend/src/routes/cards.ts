import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { db } from "../db.js";
import { requireRole } from "../middleware/requireRole.js";

export const cardsRouter = Router();

cardsRouter.post(
  "/workspaces/:workspaceId/cards",
  requireRole("collaborator"),
  (req, res) => {
    const { columnKey, title, description } = req.body;
    const workspaceId = req.params.workspaceId;

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
      // conflict OR card doesn't exist — fetch current state to tell client what's real
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

    const updated = db.prepare(`SELECT * FROM cards WHERE id = ?`).get(cardId);
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
        .get(cardId);
      res.status(409).json({ error: "Version conflict", current });
      return;
    }

    const updated = db.prepare(`SELECT * FROM cards WHERE id = ?`).get(cardId);
    res.json(updated);
  },
);

cardsRouter.delete(
  "/cards/:id",
  loadCardWorkspace,
  requireRole("collaborator"),
  (req, res) => {
    const result = db
      .prepare(`DELETE FROM cards WHERE id = ?`)
      .run(req.params.id);

    if (result.changes === 0) {
      res.status(404).json({ error: "Card not found" });
      return;
    }

    res.status(204).send();
  },
);
