import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_SHEET_ID = "1SiYSX-_g3t-9mnZJu-edTG5wMdlaKAisceqK9GCDSWs";
const SHEET_ID = process.env.WENLIU_SHEET_ID || DEFAULT_SHEET_ID;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

async function getSheet(name) {
  const url = new URL(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`);
  url.searchParams.set("tqx", "out:csv");
  url.searchParams.set("sheet", name);
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`读取 ${name} 失败：HTTP ${response.status}`);
  return parseCsv(await response.text());
}

function table(rows, expectedHeaders, sheetName) {
  const [headers = [], ...values] = rows;
  if (headers.join("|") !== expectedHeaders.join("|")) {
    throw new Error(`${sheetName} 表头不符合预期：${headers.join(", ")}`);
  }
  return values
    .filter((row) => row.some((value) => value.trim()))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

const articleRows = table(
  await getSheet("Articles"),
  ["id", "title", "deck", "source_name", "source_url", "original_language", "published_at", "archived_at", "tags", "reading_minutes", "status"],
  "Articles",
);
const blockRows = table(
  await getSheet("Blocks"),
  ["article_id", "seq", "type", "text", "level"],
  "Blocks",
);

const allowedTypes = new Set(["paragraph", "heading", "quote", "bullet", "number", "callout"]);
const blocksByArticle = new Map();
for (const row of blockRows) {
  if (!allowedTypes.has(row.type)) throw new Error(`未知正文类型：${row.type}`);
  const block = { type: row.type, text: row.text };
  if (row.level) block.level = Number(row.level);
  const current = blocksByArticle.get(row.article_id) || [];
  current.push({ seq: Number(row.seq), block });
  blocksByArticle.set(row.article_id, current);
}

const articles = articleRows
  .filter((row) => row.status === "published")
  .map((row) => {
    if (!row.id || !row.title) throw new Error("已发布文章缺少 id 或 title");
    const blocks = (blocksByArticle.get(row.id) || [])
      .sort((a, b) => a.seq - b.seq)
      .map(({ block }) => block);
    if (!blocks.length) throw new Error(`文章 ${row.id} 没有正文块`);
    return {
      id: row.id,
      title: row.title,
      deck: row.deck,
      sourceName: row.source_name,
      sourceUrl: row.source_url,
      originalLanguage: row.original_language,
      publishedAt: row.published_at,
      archivedAt: row.archived_at,
      tags: row.tags.split("|").map((tag) => tag.trim()).filter(Boolean),
      readingMinutes: Number(row.reading_minutes) || 1,
      blocks,
    };
  });

const destination = resolve(root, "data/articles.json");
await mkdir(dirname(destination), { recursive: true });
await writeFile(
  destination,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), articles }, null, 2)}\n`,
  "utf8",
);

const blockCount = articles.reduce((sum, article) => sum + article.blocks.length, 0);
console.log(`已同步 ${articles.length} 篇文章、${blockCount} 个正文块。`);
