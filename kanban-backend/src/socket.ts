import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

export let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    const workspaceId = socket.handshake.query.workspaceId;

    if (!workspaceId || Array.isArray(workspaceId)) {
      socket.disconnect();
      return;
    }

    socket.join(workspaceId);
    console.log(`Socket ${socket.id} joined workspace ${workspaceId}`);
  });
}

export function broadcastToWorkspace(
  workspaceId: number | string,
  event: string,
  payload: unknown,
) {
  io.to(String(workspaceId)).emit(event, payload);
}
