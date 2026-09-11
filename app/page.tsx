import Image from "next/image";
import Link from "next/link";
import { getArticles } from "@/lib/articles";
import { sitePath } from "@/lib/paths";

export default async function Home() {
  const articles = await getArticles();
  const [lead, ...rest] = articles;

  return (
    <main className="site-frame home-page">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="文流首页">文流</Link>
        <p>把值得留下的文章，重新排成一页好读的中文。</p>
      </header>

      <section className="index-intro" aria-labelledby="library-title">
        <div className="index-art" aria-hidden="true">
          <Image src={sitePath("/wenliu-canopy.webp")} alt="" fill priority unoptimized sizes="(max-width: 760px) 100vw, 1180px" />
        </div>
        <div className="index-copy">
          <p className="eyebrow">READING ARCHIVE · {articles.length.toString().padStart(2, "0")}</p>
          <h1 id="library-title">读得进去，<br />也留得下来。</h1>
          <p className="intro-note">原文提取、中文转写、结构重排。保留作者的论证，让网页恢复阅读应有的呼吸。</p>
        </div>
      </section>

      {lead ? (
        <section className="lead-card" aria-label="最新文章">
          <div className="lead-meta"><span>最新入库</span><span>{lead.readingMinutes} 分钟</span></div>
          <Link href={`/article/${lead.id}/`} className="lead-link">
            <h2>{lead.title}</h2>
            <p>{lead.deck}</p>
            <span className="read-action">阅读全文&nbsp; ↗</span>
          </Link>
          <div className="source-line"><span>{lead.sourceName}</span><span>{lead.archivedAt}</span></div>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section className="archive" aria-labelledby="archive-title">
          <div className="section-heading"><p className="eyebrow">ARCHIVE</p><h2 id="archive-title">所有文章</h2></div>
          <ol className="article-list">
            {rest.map((article, index) => (
              <li key={article.id}>
                <span className="article-number">{String(index + 2).padStart(2, "0")}</span>
                <Link href={`/article/${article.id}/`}>
                  <h3>{article.title}</h3>
                  <p>{article.deck}</p>
                  <div className="list-meta"><span>{article.sourceName}</span><span>{article.readingMinutes} 分钟</span></div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <footer className="site-footer"><span>文流 · 中文富文本阅读库</span><span>Google Drive 保存 · GitHub Pages 发布</span></footer>
    </main>
  );
}
