import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectRoot = process.cwd();
const functionalDirectories = ["src", "public", "tests", "features"];

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
      continue;
    }

    files.push(path);
  }

  return files;
}

test("F7-01 biome config and package check script are versioned", async () => {
  const { stdout } = await execFileAsync("git", ["ls-files", "biome.json", "package.json"], {
    cwd: projectRoot,
  });
  const trackedFiles = stdout.trim().split(/\r?\n/);
  const packageJson = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };

  assert.ok(trackedFiles.includes("biome.json"));
  assert.ok(trackedFiles.includes("package.json"));
  assert.equal(packageJson.scripts.check, "biome check .");
});

test("F7-01 biome config does not exclude functional directories", async () => {
  const biomeConfig = JSON.parse(await readFile(join(projectRoot, "biome.json"), "utf8")) as {
    files?: { ignore?: string[]; ignoreUnknown?: boolean };
  };
  const ignoredPaths = biomeConfig.files?.ignore ?? [];

  for (const directory of functionalDirectories) {
    assert.doesNotMatch(ignoredPaths.join("\n"), new RegExp(`(^|\\n)${directory}/?\\*\\*($|\\n)`));
    assert.doesNotMatch(ignoredPaths.join("\n"), new RegExp(`(^|\\n)${directory}/?$`));
  }
});

test("F7-01 no biome-ignore directives are used to hide final quality issues", async () => {
  const files = (
    await Promise.all(
      functionalDirectories.map((directory) => collectFiles(join(projectRoot, directory))),
    )
  ).flat();
  const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));
  const biomeIgnores = sources.flatMap(
    (source) => source.match(/\/\/\s*biome-ignore|\/\*\s*biome-ignore/g) ?? [],
  );

  assert.deepEqual(biomeIgnores, []);
});
