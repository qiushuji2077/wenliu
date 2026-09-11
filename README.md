# 文流

文流是一座适合手机长读的中文富文本文章库。网站可安装到手机主屏幕，并在访问过文章后提供离线阅读。

## 内容与发布

- Google Sheet 是日常入库入口。
- `data/articles.json` 保存完整文章快照；网站构建和离线阅读不依赖运行时数据库。
- GitHub Actions 在推送后以及每小时两次刷新 Google Sheet，并部署到 GitHub Pages。
- 当前快照含文章元数据、标签、排序以及全部正文块，不是只有文章链接。

## 本地运行

需要 Node.js 22。

```bash
npm ci
npm run dev
```

刷新公开 Google Sheet 内容：

```bash
npm run sync:content
```

模拟 GitHub Pages 的 `/wenliu` 路径并生成静态网站：

```bash
GITHUB_PAGES=true npm run build
```

构建结果位于 `out/`。

## GitHub Pages

仓库在 `main` 分支更新后，`.github/workflows/pages.yml` 会生成静态站并发布。仓库第一次使用时，请在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。

线上地址：`https://qiushuji2077.github.io/wenliu/`
