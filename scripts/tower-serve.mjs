#!/usr/bin/env node
/**
 * Production bind for Docker / tower.local.
 * Does not change the Grok live-preview contract (0.0.0.0:8080).
 */
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

const port = process.env.PORT || "8088";
const host = "0.0.0.0";

function run(cmd, args, extraEnv = {}) {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production", PORT: port, HOST: host, ...extraEnv },
  });
  child.on("exit", (code) => process.exit(code ?? 1));
}

if (existsSync(".output/server/index.mjs")) {
  run("node", [".output/server/index.mjs"], { NITRO_PORT: port, NITRO_HOST: host });
} else if (existsSync("server/index.mjs")) {
  run("node", ["server/index.mjs"], { NITRO_PORT: port, NITRO_HOST: host });
} else {
  run("npx", ["vite", "preview", "--host", host, "--port", port]);
}
