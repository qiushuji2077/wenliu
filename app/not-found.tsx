import Link from "next/link";

export default function NotFound() {
  return <main className="empty-state"><p className="eyebrow">404 · NOT FOUND</p><h1>这篇文章还没有流到这里。</h1><Link href="/">← 返回文流</Link></main>;
}
