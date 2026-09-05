import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";

async function collectTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectTests(path)));
      continue;
    }

    if (entry.name.endsWith(".test.ts") && extname(entry.name) === ".ts") {
      files.push(path);
    }
  }

  return files;
}

const tsxExecutable = process.platform === "win32" ? "tsx.cmd" : "tsx";
const testFiles = await collectTests("tests");

const child = spawn(join("node_modules", ".bin", tsxExecutable), ["--test", ...testFiles], {
  shell: process.platform === "win32",
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
