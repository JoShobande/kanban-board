import { createServer } from "http";
import { app } from "./app.js";
import "./db.js";

const httpServer = createServer(app);
const PORT = 4000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
