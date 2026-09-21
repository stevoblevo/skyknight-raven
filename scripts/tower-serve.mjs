#!/usr/bin/env node
/**
 * Production preview bind for Docker / tower.local.
 * Does not change the Grok live-preview contract (0.0.0.0:8080).
 */
import { spawn } from "node:child_process";

const port = process.env.PORT || "8088";
const child = spawn(
  "npx",
  ["vite", "preview", "--host", "0.0.0.0", "--port", port],
  { stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } },
);
child.on("exit", (code) => process.exit(code ?? 1));
