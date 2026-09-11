---
name: wenliu
description: >-
  Publishes a link, PDF, or pasted article to 仇皓's 文流 reading site so it opens on his phone.
  Use when he sends an article URL, PDF, 公众号/博客正文, or says 文流, 收进文流, 翻译并发布, 手机打开, or qiushuji2077.github.io/wenliu.
  He only supplies the source; the agent decides translation, inbox, commit, and push.
---

# 文流

用户契约（原话）：自行决定操作；每次只传文章和链接，能出现在手机网址上就可以了。

这是对 `qiushuji2077/wenliu` 的 `main` 的长期授权：入库后直接提交并 `git push origin main`，不要问是否提交、是否推送、是否改表格。

手机站点：https://qiushuji2077.github.io/wenliu/  
单篇：https://qiushuji2077.github.io/wenliu/article/<id>/

仓库：`/Users/xiaoruirui/Developer/wenliu`。一开始就 `move_agent_to_root` 到这里，再改文件。

## 对用户只回什么

成功后只给手机能打开的单篇网址。不要解释 git、Sheet、inbox、CI。失败时用一句话说卡在哪，不要把步骤甩给他。

## 分流

- **外文**：译成自然中文。忠实达意，不添不删论点。专名、案例编号、模型名保留原文。
- **本来就是中文**：不翻译，只提取和排版。
- **原结构已经清楚**：标题、列表、引文原样沿用，不重拟大纲。

不要扩写成评论，不要加「启示」「总结一下」。

## 为什么必须走 inbox

GitHub Actions 每小时从 Google Sheet 重建 `data/articles.json`。只改快照会被盖掉。新稿写入 `data/inbox/<id>.json`，由 `scripts/sync-google-sheet.mjs` 合并。inbox 与表格同 id 时，inbox 覆盖。

## 文章对象

`data/inbox/<id>.json` 一篇一篇放，字段与 `lib/articles.ts` 一致：

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
- `archivedAt`：当天入库日。首页按它倒序。
- `readingMinutes`：中文约 400 字/分钟，最少 1。
- `blocks[].type` 仅允许：`paragraph` `heading` `quote` `bullet` `number` `callout`。
- `heading` 可带 `level`：`2` 或 `3`。
- 外文译稿第一块用 `callout` 标明原文标题、作者/机构与日期。

## 发布（自己做完）

1. 读原文（链接、PDF 或粘贴正文），按分流处理。过程稿只写 `/Users/xiaoruirui/Scratch`。
2. 写 `data/inbox/<id>.json`。禁止只改 `data/articles.json`。
3. 顺手写 `data/sheet-rows/<id>/articles.csv` 与 `blocks.csv`（内部底稿，不要求用户粘贴）。
4. `npm run sync:content`。确认新 id 在合并结果里。
5. 提交 inbox JSON、同步后的 `data/articles.json`、sheet-rows；`git push origin main`。
6. 等 Pages 成功后，只把 `https://qiushuji2077.github.io/wenliu/article/<id>/` 发给用户。

`articles.csv` 表头：`id,title,deck,source_name,source_url,original_language,published_at,archived_at,tags,reading_minutes,status`  
`tags` 用 `|`；`status` 为 `published`。  
`blocks.csv` 表头：`article_id,seq,type,text,level`；`seq` 从 1 起；非 heading 的 `level` 留空。

## 禁止

- 禁止问用户要不要提交、推送、改表格、开 PR。
- 禁止只改快照就当发布完成；inbox 必须进仓库。
- 禁止改已有 id、已占用路径，或 Pages 的 `/wenliu` 前缀。
- 禁止把 PDF、中间译稿提交进仓库。
