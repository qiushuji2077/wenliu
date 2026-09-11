import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, getArticles, type ContentBlock } from "@/lib/articles";
import { sitePath } from "@/lib/paths";
import { ReadingTools } from "./reading-tools";

export const dynamicParams = false;
type PageProps = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return (await getArticles()).map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await getArticle((await params).id);
  return article ? { title: article.title, description: article.deck } : { title: "文章未找到" };
}

function Blocks({ blocks }: { blocks: ContentBlock[] }) {
  const output: React.ReactNode[] = [];
  let list: { type: "bullet" | "number"; items: string[]; start: number } | null = null;
  const flush = () => {
    if (!list) return;
    const items = list.items.map((text, index) => <li key={`${list!.start}-${index}`}>{text}</li>);
    output.push(list.type === "bullet" ? <ul key={`list-${list.start}`}>{items}</ul> : <ol key={`list-${list.start}`}>{items}</ol>);
    list = null;
  };
  blocks.forEach((block, index) => {
    if (block.type === "bullet" || block.type === "number") {
      if (!list || list.type !== block.type) { flush(); list = { type: block.type, items: [], start: index }; }
      list.items.push(block.text);
      return;
    }
    flush();
    if (block.type === "heading") {
      const id = `section-${index}`;
      output.push(block.level === 3 ? <h3 id={id} key={index}>{block.text}</h3> : <h2 id={id} key={index}>{block.text}</h2>);
    }
    else if (block.type === "quote") output.push(<blockquote key={index}>{block.text}</blockquote>);
    else if (block.type === "callout") output.push(<div className="callout" key={index}>{block.text}</div>);
    else output.push(<p key={index}>{block.text}</p>);
  });
  flush();
  return <>{output}</>;
}

export default async function ArticlePage({ params }: PageProps) {
  const article = await getArticle((await params).id);
  if (!article) notFound();
  const headings = article.blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => block.type === "heading")
    .map(({ block, index }) => ({ id: `section-${index}`, text: block.text, level: block.level ?? 2 }));
  return (
    <main className="site-frame article-shell">
      <ReadingTools />
      <nav className="article-nav">
        <Link className="wordmark" href="/">文流</Link>
        <Link className="back" href="/">返回文章库</Link>
      </nav>
      <div className="article-art" aria-hidden="true">
        <Image src={sitePath("/wenliu-canopy.webp")} alt="" fill priority unoptimized sizes="(max-width: 760px) 100vw, 1180px" />
      </div>
      <header className="article-hero">
        <p className="eyebrow">READING · {article.readingMinutes} MIN</p>
        <div className="article-hero-main">
          <span className="article-kicker">{article.tags.join(" · ") || "收录文章"}</span>
          <h1>{article.title}</h1>
          <p className="article-deck">{article.deck}</p>
          <div className="article-info"><span>来源：{article.sourceName}</span><span>原文语言：{article.originalLanguage}</span><span>入库：{article.archivedAt}</span></div>
        </div>
      </header>
      <section className="article-body-wrap">
        <aside className="article-rail">
          <div className="rail-sticky">
            <Link className="rail-back" href="/">返回文流</Link>
            <p>阅读目录</p>
            {headings.length ? (
              <nav aria-label="文章目录">
                {headings.map((heading) => (
                  <a className={heading.level === 3 ? "level-three" : ""} href={`#${heading.id}`} key={heading.id}>{heading.text}</a>
                ))}
              </nav>
            ) : <span className="rail-empty">正文 · TEXT</span>}
          </div>
        </aside>
        <article className="richtext">
          {headings.length ? (
            <details className="mobile-toc">
              <summary>文章目录</summary>
              <nav aria-label="文章目录">
                {headings.map((heading) => <a href={`#${heading.id}`} key={heading.id}>{heading.text}</a>)}
              </nav>
            </details>
          ) : null}
          <Blocks blocks={article.blocks} />
          <div className="source-footer">
            <p>本文经提取、中文转写与富文本重排，观点与事实归原作者所有。</p>
            {article.sourceUrl ? <a href={article.sourceUrl} target="_blank" rel="noreferrer">查看原文 ↗</a> : null}
          </div>
          <Link className="end-return" href="/">读完了，返回文章库</Link>
        </article>
      </section>
    </main>
  );
}
