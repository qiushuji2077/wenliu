"use client";

import { ArrowLeft, ArrowUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function ReadingTools() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      const distance = root.scrollHeight - root.clientHeight;
      const value = distance > 0 ? Math.min(100, Math.max(0, (root.scrollTop / distance) * 100)) : 0;
      setProgress(value);
      setShowTop(root.scrollTop > 680);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
      <div className="reading-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="mobile-reading-bar">
        <Link href="/" aria-label="返回文章库"><ArrowLeft size={18} strokeWidth={1.7} /></Link>
        <span>文流</span>
        <span className="progress-number">{Math.round(progress)}%</span>
      </div>
      <button
        className={`back-to-top${showTop ? " is-visible" : ""}`}
        type="button"
        aria-label="回到文章顶部"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ArrowUp size={18} strokeWidth={1.7} />
      </button>
    </>
  );
}
