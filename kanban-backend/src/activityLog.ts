import { db } from "./db.js";

export function logActivity(
  workspaceId: number | string,
  actor: string,
  action: string,
  detail: string,
) {
  db.prepare(
    `INSERT INTO activity_log (workspace_id, actor, action, detail) VALUES (?, ?, ?, ?)`,
  ).run(workspaceId, actor, action, detail);
}
