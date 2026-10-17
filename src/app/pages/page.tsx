import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Pages" };
export const revalidate = 60;

type PublicPage = {
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  url: string;
};

export default async function PagesIndex() {
  let pages: PublicPage[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("pages")
      .select("title,title_en,description,description_en,url")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    pages = data ?? [];
  } catch {
    pages = [];
  }

  return (
    <section>
      <p className="eyebrow">Community information</p>
      <h1>Pages</h1>
      <p className="lead">Public information pages published by the community administrators.</p>
      {pages.length === 0 ? (
        <article className="card"><p>No public pages have been published yet.</p></article>
      ) : (
        <div className="section-grid">
          {pages.map((page) => (
            <article className="card" key={page.url}>
              <h2><Link href={`/p/${encodeURIComponent(page.url)}`}>{page.title_en || page.title}</Link></h2>
              {(page.description_en || page.description) && <p>{page.description_en || page.description}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
