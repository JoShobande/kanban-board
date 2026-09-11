import { io } from "socket.io-client";

const clientA = io("http://localhost:4000", { query: { workspaceId: "1" } });
const clientB = io("http://localhost:4000", { query: { workspaceId: "2" } });

clientA.on("connect", () =>
  console.log("Client A connected, joined workspace 1"),
);
clientB.on("connect", () =>
  console.log("Client B connected, joined workspace 2"),
);

clientA.onAny((event, payload) =>
  console.log("[Client A received]", event, payload),
);
clientB.onAny((event, payload) =>
  console.log("[Client B received]", event, payload),
);
