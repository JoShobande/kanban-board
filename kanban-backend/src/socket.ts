import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

export let io: Server;

// track who's in each workspace room: workspaceId -> Set of userIds
const presence = new Map<string, Set<string>>();

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    const workspaceId = socket.handshake.query.workspaceId;
    const userId = socket.handshake.query.userId;

    if (
      !workspaceId ||
      Array.isArray(workspaceId) ||
      !userId ||
      Array.isArray(userId)
    ) {
      socket.disconnect();
      return;
    }

    socket.join(workspaceId);

    if (!presence.has(workspaceId)) {
      presence.set(workspaceId, new Set());
    }
    presence.get(workspaceId)!.add(userId);

    io.to(workspaceId).emit(
      "presence:update",
      Array.from(presence.get(workspaceId)!),
    );

    socket.on("disconnect", () => {
      presence.get(workspaceId)?.delete(userId);
      io.to(workspaceId).emit(
        "presence:update",
        Array.from(presence.get(workspaceId) ?? []),
      );
    });
  });
}

export function broadcastToWorkspace(
  workspaceId: number | string,
  event: string,
  payload: unknown,
) {
  io.to(String(workspaceId)).emit(event, payload);
}
