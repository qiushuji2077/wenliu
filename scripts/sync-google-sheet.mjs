import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_SHEET_ID = "1SiYSX-_g3t-9mnZJu-edTG5wMdlaKAisceqK9GCDSWs";
const SHEET_ID = process.env.WENLIU_SHEET_ID || DEFAULT_SHEET_ID;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const allowedTypes = new Set(["paragraph", "heading", "quote", "bullet", "number", "callout"]);

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

function validateArticle(article, origin) {
  if (!article || typeof article !== "object") throw new Error(`${origin} 不是文章对象`);
  if (!article.id || !article.title) throw new Error(`${origin} 缺少 id 或 title`);
  if (!Array.isArray(article.blocks) || !article.blocks.length) {
    throw new Error(`${origin} 没有正文块`);
  }
  for (const block of article.blocks) {
    if (!allowedTypes.has(block.type)) throw new Error(`${origin} 未知正文类型：${block.type}`);
    if (typeof block.text !== "string" || !block.text.trim()) {
      throw new Error(`${origin} 存在空正文块`);
    }
  }
  return {
    id: article.id,
    title: article.title,
    deck: article.deck ?? "",
    sourceName: article.sourceName ?? "",
    sourceUrl: article.sourceUrl ?? "",
    originalLanguage: article.originalLanguage ?? "",
    publishedAt: article.publishedAt ?? "",
    archivedAt: article.archivedAt ?? "",
    tags: Array.isArray(article.tags)
      ? article.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : String(article.tags ?? "")
          .split("|")
          .map((tag) => tag.trim())
          .filter(Boolean),
    readingMinutes: Number(article.readingMinutes) || 1,
    blocks: article.blocks.map((block) => {
      const next = { type: block.type, text: block.text };
      if (block.level) next.level = Number(block.level);
      return next;
    }),
  };
}

function articlesFromSheet(articleRows, blockRows) {
  const blocksByArticle = new Map();
  for (const row of blockRows) {
    if (!allowedTypes.has(row.type)) throw new Error(`未知正文类型：${row.type}`);
    const block = { type: row.type, text: row.text };
    if (row.level) block.level = Number(row.level);
    const current = blocksByArticle.get(row.article_id) || [];
    current.push({ seq: Number(row.seq), block });
    blocksByArticle.set(row.article_id, current);
  }

  return articleRows
    .filter((row) => row.status === "published")
    .map((row) => {
      const blocks = (blocksByArticle.get(row.id) || [])
        .sort((a, b) => a.seq - b.seq)
        .map(({ block }) => block);
      return validateArticle(
        {
          id: row.id,
          title: row.title,
          deck: row.deck,
          sourceName: row.source_name,
          sourceUrl: row.source_url,
          originalLanguage: row.original_language,
          publishedAt: row.published_at,
          archivedAt: row.archived_at,
          tags: row.tags,
          readingMinutes: row.reading_minutes,
          blocks,
        },
        `sheet:${row.id || "(missing-id)"}`,
      );
    });
}

async function loadInboxArticles() {
  const dir = resolve(root, "data/inbox");
  if (!existsSync(dir)) return [];

  const files = (await readdir(dir))
    .filter((name) => name.endsWith(".json"))
    .sort();
  const articles = [];

  for (const name of files) {
    const raw = JSON.parse(await readFile(resolve(dir, name), "utf8"));
    const list = Array.isArray(raw) ? raw : Array.isArray(raw.articles) ? raw.articles : [raw];
    for (const [index, item] of list.entries()) {
      articles.push(validateArticle(item, `inbox:${name}#${index}`));
    }
  }
  return articles;
}

function mergeArticles(sheetArticles, inboxArticles) {
  const byId = new Map();
  for (const article of sheetArticles) byId.set(article.id, article);

  let added = 0;
  let replaced = 0;
  for (const article of inboxArticles) {
    if (byId.has(article.id)) replaced += 1;
    else added += 1;
    byId.set(article.id, article);
  }

  return {
    articles: [...byId.values()],
    added,
    replaced,
  };
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

const sheetArticles = articlesFromSheet(articleRows, blockRows);
const inboxArticles = await loadInboxArticles();
const { articles, added, replaced } = mergeArticles(sheetArticles, inboxArticles);

const destination = resolve(root, "data/articles.json");
await mkdir(dirname(destination), { recursive: true });
await writeFile(
  destination,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), articles }, null, 2)}\n`,
  "utf8",
);

const blockCount = articles.reduce((sum, article) => sum + article.blocks.length, 0);
console.log(
  `已同步 ${articles.length} 篇文章、${blockCount} 个正文块（Sheet ${sheetArticles.length} 篇，inbox ${inboxArticles.length} 篇，新增 ${added} 篇，覆盖 ${replaced} 篇）。`,
);
