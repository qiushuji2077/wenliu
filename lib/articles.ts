import snapshot from "@/data/articles.json";

export type ContentBlock = {
  type: "paragraph" | "heading" | "quote" | "bullet" | "number" | "callout";
  text: string;
  level?: number;
};

export type Article = {
  id: string;
  title: string;
  deck: string;
  sourceName: string;
  sourceUrl: string;
  originalLanguage: string;
  publishedAt: string;
  archivedAt: string;
  tags: string[];
  readingMinutes: number;
  blocks: ContentBlock[];
};

export async function getArticles(): Promise<Article[]> {
  return (snapshot.articles as Article[]).toSorted((a, b) => b.archivedAt.localeCompare(a.archivedAt));
}

export async function getArticle(id: string) {
  return (await getArticles()).find((article) => article.id === id) ?? null;
}
