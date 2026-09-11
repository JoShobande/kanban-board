import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import "./db.js";
import { initSocket } from "./socket.js";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

initSocket(httpServer);

const PORT = 4000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
