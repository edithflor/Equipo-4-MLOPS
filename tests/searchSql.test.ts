import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  type SearchReader,
  type SearchResponse,
  SearchService,
  parseSearchQuery,
} from "../src/logic/searchQuery.js";

const projectRoot = process.cwd();

class CapturingSearchReader implements SearchReader {
  public calls = 0;
  public terms: string[] = [];

  public async searchImagesByCategories(query: {
    terms: string[];
  }): Promise<SearchResponse> {
    this.calls += 1;
    this.terms = query.terms;

    return {
      items: [
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          filename: "image-a.png",
          mimetype: "image/png",
          size: 1,
          url: "/images/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/content",
          createdAt: new Date("2026-09-10T00:00:00.000Z"),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    };
  }
}

test("search parser supports single class and AND case-insensitively", () => {
  assert.deepEqual(parseSearchQuery({ q: " car " }).terms, ["car"]);
  assert.deepEqual(parseSearchQuery({ q: "  CAR   and   Person " }).terms, ["car", "person"]);
});

test("search parser rejects malformed AND queries", () => {
  assert.throws(() => parseSearchQuery({ q: "" }), /obligatorio/i);
  assert.throws(() => parseSearchQuery({ q: "AND car" }), /malformado/i);
  assert.throws(() => parseSearchQuery({ q: "car AND" }), /malformado/i);
  assert.throws(() => parseSearchQuery({ q: "car AND AND person" }), /malformado/i);
});

test("search service does not execute repository query when Zod validation fails", async () => {
  const reader = new CapturingSearchReader();
  const service = new SearchService(reader);

  await assert.rejects(() => service.search({ q: "car AND" }), /malformado/i);
  assert.equal(reader.calls, 0);
});

test("search service passes controlled AND terms to the SQL reader", async () => {
  const reader = new CapturingSearchReader();
  const service = new SearchService(reader);

  const result = await service.search({ q: "car AND person" });

  assert.deepEqual(reader.terms, ["car", "person"]);
  assert.equal(result.total, 1);
  assert.equal(result.page, 1);
  assert.equal(result.limit, 10);
  assert.equal(result.items[0]?.filename, "image-a.png");
});

test("search repository resolves AND with SQL where group by and having", async () => {
  const source = await readFile(join(projectRoot, "src", "data", "searchRepository.ts"), "utf8");

  assert.match(source, /inArray\(lowerCategoryName, query\.terms\)/);
  assert.match(source, /matchingImagesQuery\.where\(and\(\.\.\.whereConditions\)\)/);
  assert.match(source, /groupBy\(images\.id\)/);
  assert.match(source, /having\(sql`\$\{matchedCategoryCount\} = \$\{query\.terms\.length\}`\)/);
  assert.match(source, /count\(distinct lower\(\$\{categories\.name\}\)\)/);
  assert.match(source, /innerJoin\(bboxes, eq\(images\.id, bboxes\.imageId\)\)/);
  assert.match(source, /innerJoin\(categories, eq\(bboxes\.categoryId, categories\.id\)\)/);
  assert.match(source, /\.as\("matching_images"\)/);
  assert.match(source, /select\(\{ value: count\(\) \}\)\.from\(matchingImagesForTotal\)/);
  assert.match(
    source,
    /innerJoin\(matchingImagesForItems, eq\(images\.id, matchingImagesForItems\.imageId\)\)/,
  );
  assert.match(source, /\.limit\(query\.limit\)/);
  assert.match(source, /\.offset\(query\.offset\)/);
});

test("search repository does not load the dataset and filter in memory", async () => {
  const source = await readFile(join(projectRoot, "src", "data", "searchRepository.ts"), "utf8");

  assert.doesNotMatch(source, /findMany/);
  assert.doesNotMatch(source, /select\(\)\.from\(images\)/);
  assert.doesNotMatch(source, /\.filter\(/);
  assert.doesNotMatch(source, /\.every\(/);
  assert.doesNotMatch(source, /\.includes\(/);
  assert.doesNotMatch(source, /\.slice\(/);
  assert.doesNotMatch(source, /sql\.raw/);
});

test("search endpoint is mounted and validates query params through the HTTP API", async () => {
  const indexSource = await readFile(join(projectRoot, "src", "index.ts"), "utf8");
  const routeSource = await readFile(
    join(projectRoot, "src", "presentation", "searchRoutes.ts"),
    "utf8",
  );

  assert.match(indexSource, /import \{ searchRoutes \}/);
  assert.match(indexSource, /app\.use\("\/search", searchRoutes\)/);
  assert.match(routeSource, /searchRoutes\.get\("\/"/);
  assert.match(routeSource, /searchService\.search\(req\.query\)/);
  assert.match(routeSource, /error instanceof ZodError/);
  assert.match(routeSource, /status\(400\)/);
});

test("search UI consumes the HTTP endpoint and avoids DB or storage imports", async () => {
  const html = await readFile(join(projectRoot, "public", "index.html"), "utf8");
  const clientScript = await readFile(join(projectRoot, "public", "app.js"), "utf8");
  const publicSource = `${html}\n${clientScript}`;

  assert.match(html, /id="search-form"/);
  assert.match(html, /id="search-results"/);
  assert.match(clientScript, /fetch\(`\/search\?\$\{params\.toString\(\)\}`\)/);
  assert.match(
    clientScript,
    /renderSearchResults\(payload\.items, payload\.total, payload\.page, payload\.limit\)/,
  );
  assert.doesNotMatch(publicSource, /drizzle/i);
  assert.doesNotMatch(publicSource, /mysql/i);
  assert.doesNotMatch(publicSource, /mariadb/i);
  assert.doesNotMatch(publicSource, /minio/i);
});
