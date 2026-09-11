---
name: wenliu
description: >-
  把链接或正文收进文流：外文译成自然中文，中文只提取排版，写入 inbox 补丁并发布到 GitHub Pages。
  用户提到文流、/wenliu、收进文流、翻译并发布到文流或 qiushuji2077.github.io/wenliu 时使用。
---

# 文流发布

文流是 `qiushuji2077/wenliu` 的中文长读库。日常入口是 Google Sheet，GitHub Actions 每小时从表格重建 `data/articles.json` 并发布 Pages。

**只改快照、不打补丁，新文章会被下一轮同步盖掉。** 新稿必须写入 `data/inbox/<id>.json`，由 `scripts/sync-google-sheet.mjs` 与表格合并。

站点：https://qiushuji2077.github.io/wenliu/  
单篇：https://qiushuji2077.github.io/wenliu/article/<id>/

## 分流

- **外文**：译成自然中文。忠实达意，不添不删论点。专名、案例编号、模型名保留原文。
- **本来就是中文**：不翻译，只提取和排版。
- **原结构已经清楚**：标题、列表、引文原样沿用，不重拟大纲。

不要扩写成评论，不要加「启示」「总结一下」，不要把报告改成鸡汤。

## 文章对象

`data/inbox/<id>.json` 放一篇完整文章，字段与 `lib/articles.ts` 一致：

```json
{
  "id": "kebab-case-slug",
  "title": "中文标题",
  "deck": "一两句导语",
  "sourceName": "来源名",
  "sourceUrl": "https://...",
  "originalLanguage": "英文",
  "publishedAt": "2026-09-10",
  "archivedAt": "2026-09-11",
  "tags": ["标签"],
  "readingMinutes": 8,
  "blocks": [{ "type": "paragraph", "text": "……" }]
}
```

- `id`：小写英文短横线，稳定后不要改。
- `archivedAt`：入库日，首页按它倒序。
- `readingMinutes`：中文约 400 字/分钟，最少 1。
- `blocks[].type` 仅允许：`paragraph` `heading` `quote` `bullet` `number` `callout`。
- `heading` 可带 `level`：`2` 或 `3`。
- 外文译稿第一块用 `callout` 标明原文标题、作者/机构与日期。

## 发布步骤

1. 读原文（链接、PDF 或粘贴正文），按上面分流处理。
2. 写成一篇 `data/inbox/<id>.json`。不要只改 `data/articles.json`。
3. 同时把表格行写到 `data/sheet-rows/<id>/articles.csv` 与 `blocks.csv`，方便手工追加进「文流｜文章索引与内容库」。不要整表覆盖。
4. 在仓库根目录运行：

```bash
npm run sync:content
```

   预期类似：`Sheet 里 3 篇，inbox 再加 1 篇，合并后 4 篇都在`。inbox 与表格 id 相同时，inbox 覆盖表格。

5. 提交并推到 `main`（至少包含 inbox JSON；同步后的 `data/articles.json` 一并提交）。推送后 Actions 会再跑一次同步并发布 Pages。
6. 把手机链接发回：`https://qiushuji2077.github.io/wenliu/article/<id>/`

## 表格行格式

`articles.csv` 表头必须是：

```text
id,title,deck,source_name,source_url,original_language,published_at,archived_at,tags,reading_minutes,status
```

`tags` 用 `|` 连接；`status` 填 `published`。

`blocks.csv` 表头必须是：

```text
article_id,seq,type,text,level
```

`seq` 从 1 起；非 heading 的 `level` 留空。

## 禁止

- 禁止只改 `data/articles.json` 就当作发布完成。
- 禁止把 inbox 文件留在本地不提交。CI 读的是仓库里的 inbox。
- 禁止改已有文章的 id、已占用子路径，或改 Pages 的 `/wenliu` 前缀。
- 禁止把过程稿、PDF、中间翻译放进仓库；过程文件写到 `/Users/xiaoruirui/Scratch`。
