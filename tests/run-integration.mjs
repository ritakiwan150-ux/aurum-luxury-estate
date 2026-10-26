// Starts the mock Laravel API and the built Next.js app, runs the integration tests, then stops everything.
// Usage:  npm run build  &&  npm run test:integration
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const MOCK_PORT = 8010;
const APP_PORT = 3010;
const children = [];
const run = (cmd, args, env = {}) => {
  const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...env }, shell: process.platform === "win32" });
  children.push(child);
  return child;
};
const stopAll = () => children.forEach((child) => { try { child.kill(); } catch { /* already gone */ } });
const waitFor = async (url) => {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(url, { redirect: "manual" })).status) return; } catch { /* not up yet */ } await sleep(500); }
  throw new Error(`${url} did not start`);
};

try {
  run("node", ["tests/mock-api.mjs", String(MOCK_PORT)]);
  run("npx", ["next", "start", "-p", String(APP_PORT)], { API_INTERNAL_URL: `http://127.0.0.1:${MOCK_PORT}`, NODE_ENV: "production" });
  await waitFor(`http://127.0.0.1:${MOCK_PORT}/api/__calls`);
  await waitFor(`http://127.0.0.1:${APP_PORT}/api/auth/session`);
  const tests = run("node", ["--test", "tests/bff.integration.test.mjs"], { APP_URL: `http://127.0.0.1:${APP_PORT}`, MOCK_URL: `http://127.0.0.1:${MOCK_PORT}` });
  tests.stdout.pipe(process.stdout);
  tests.stderr.pipe(process.stderr);
  const code = await new Promise((resolve) => tests.on("exit", resolve));
  stopAll();
  process.exit(code ?? 1);
} catch (error) {
  console.error(error);
  stopAll();
  process.exit(1);
}
