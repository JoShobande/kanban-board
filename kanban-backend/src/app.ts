import express from "express";
import cors from "cors";
import { attachUser } from "./middleware/auth.js";
import { workspacesRouter } from "./routes/workspaces.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(attachUser);
app.use("/api/workspaces", workspacesRouter);
