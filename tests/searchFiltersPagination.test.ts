import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { parseSearchQuery } from "../src/logic/searchQuery.js";

const projectRoot = process.cwd();

test("f5-04 parses class, status, date range, page, limit, and offset", () => {
  const parsed = parseSearchQuery({
    class: "car",
    status: "annotated",
    from: "2026-09-01",
    to: "2026-09-30",
    page: "2",
    limit: "5",
  });

  assert.deepEqual(parsed.terms, ["car"]);
  assert.equal(parsed.status, "annotated");
  assert.equal(parsed.from?.toISOString(), "2026-09-01T00:00:00.000Z");
  assert.equal(parsed.toExclusive?.toISOString(), "2026-10-01T00:00:00.000Z");
  assert.equal(parsed.page, 2);
  assert.equal(parsed.limit, 5);
  assert.equal(parsed.offset, 5);
});

test("f5-04 combines q and class as AND terms", () => {
  const parsed = parseSearchQuery({ q: "car AND person", class: "animal" });

  assert.deepEqual(parsed.terms, ["car", "person", "animal"]);
});

test("f5-04 rejects invalid status dates range page and limit", () => {
  assert.throws(() => parseSearchQuery({ status: "done" }), /Invalid option/i);
  assert.throws(() => parseSearchQuery({ from: "2026-09-31" }), /fecha/i);
  assert.throws(() => parseSearchQuery({ from: "2026-10-01", to: "2026-09-01" }), /rango/i);
  assert.throws(() => parseSearchQuery({ page: "0" }), /página/i);
  assert.throws(() => parseSearchQuery({ limit: "51" }), /excede/i);
});

test("f5-04 repository composes class status and date filters in SQL", async () => {
  const source = await readFile(join(projectRoot, "src", "data", "searchRepository.ts"), "utf8");

  assert.match(source, /buildImageFilterConditions\(query\)/);
  assert.match(source, /status === "annotated"/);
  assert.match(source, /status === "pending"/);
  assert.match(source, /exists \(select 1 from bboxes as status_bboxes/);
  assert.match(source, /not exists \(select 1 from bboxes as status_bboxes/);
  assert.match(source, /gte\(images\.createdAt, query\.from\)/);
  assert.match(source, /lt\(images\.createdAt, query\.toExclusive\)/);
  assert.match(source, /and\(\.\.\.whereConditions\)/);
  assert.match(source, /inArray\(lowerCategoryName, query\.terms\)/);
});

test("f5-04 total uses same filtered subquery as items", async () => {
  const source = await readFile(join(projectRoot, "src", "data", "searchRepository.ts"), "utf8");

  assert.match(source, /matchingImagesForItems = this\.buildMatchingImagesSubquery\(query\)/);
  assert.match(source, /matchingImagesForTotal = this\.buildMatchingImagesSubquery\(query\)/);
  assert.match(source, /select\(\{ value: count\(\) \}\)\.from\(matchingImagesForTotal\)/);
});

test("f5-04 pagination uses real limit offset and no in-memory paging", async () => {
  const source = await readFile(join(projectRoot, "src", "data", "searchRepository.ts"), "utf8");

  assert.match(source, /\.limit\(query\.limit\)/);
  assert.match(source, /\.offset\(query\.offset\)/);
  assert.doesNotMatch(source, /\.slice\(/);
  assert.doesNotMatch(source, /\.filter\(/);
});

test("f5-04 UI exposes filters pagination and only calls HTTP API", async () => {
  const html = await readFile(join(projectRoot, "public", "index.html"), "utf8");
  const clientScript = await readFile(join(projectRoot, "public", "app.js"), "utf8");
  const publicSource = `${html}\n${clientScript}`;

  assert.match(html, /id="search-query"/);
  assert.match(html, /id="search-status"/);
  assert.match(html, /id="search-from"/);
  assert.match(html, /id="search-to"/);
  assert.match(html, /id="search-limit"/);
  assert.match(html, /id="clear-search-button"/);
  assert.match(html, /id="search-prev-button"/);
  assert.match(html, /id="search-next-button"/);
  assert.match(html, /id="search-page-label"/);
  assert.match(clientScript, /appendSearchParam\(params, "status", searchStatusInput\.value\)/);
  assert.match(clientScript, /appendSearchParam\(params, "from", searchFromInput\.value\)/);
  assert.match(clientScript, /appendSearchParam\(params, "to", searchToInput\.value\)/);
  assert.match(clientScript, /params\.set\("page", String\(page\)\)/);
  assert.doesNotMatch(publicSource, /drizzle|mysql|mariadb|minio/i);
});
