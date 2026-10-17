import { sanitizeManagedHtml } from "@/lib/sanitize-managed-html";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 60;

type DynamicPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: DynamicPageProps) {
  const { slug } = await params;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("pages")
      .select("title,title_en,description,description_en,visibility")
      .eq("url", slug)
      .eq("visibility", "public")
      .maybeSingle();
    if (!data) return { title: "Page not found" };
    return {
      title: data.title_en || data.title,
      description: data.description_en || data.description || undefined,
    };
  } catch {
    return { title: "Page" };
  }
}

export default async function ManagedContentPage({ params }: DynamicPageProps) {
  const { slug } = await params;
  let row: { title: string; title_en: string | null; content: string; content_en: string | null; description: string | null; description_en: string | null } | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("pages")
      .select("title,title_en,content,content_en,description,description_en")
      .eq("url", slug)
      .eq("visibility", "public")
      .maybeSingle();
    if (error) throw error;
    row = data;
  } catch {
    notFound();
  }

  if (!row) notFound();

  const safeHtml = sanitizeManagedHtml(row.content_en || row.content || "");

  return (
    <article className="card managed-page">
      <h1>{row.title_en || row.title}</h1>
      {(row.description_en || row.description) && (
        <p className="lead">{row.description_en || row.description}</p>
      )}
      <div className="managed-html" dangerouslySetInnerHTML={{ __html: safeHtml }} />
    </article>
  );
}
