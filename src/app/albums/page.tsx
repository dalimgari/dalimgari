import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Albums" };
export const dynamic = "force-dynamic";

export default async function AlbumsPage() {
  let albums: { id: string; title: string; title_en: string | null; description: string | null; description_en: string | null; url: string; media: unknown }[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("albums")
      .select("id,title,title_en,description,description_en,url,media")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(100);
    albums = (data ?? []).filter((album) => Array.isArray(album.media) && album.media.length > 0);
  } catch {
    albums = [];
  }

  return (
    <section>
      <p className="eyebrow">Community photographs</p>
      <h1>Albums</h1>
      <p className="lead">Public albums with available photographs appear here.</p>
      {albums.length === 0 ? (
        <article className="card"><p>No public albums with photographs have been published yet.</p></article>
      ) : (
        <div className="section-grid">
          {albums.map((album) => (
            <Link className="card card-link" href={`/gallery/${encodeURIComponent(album.url)}`} key={album.id}>
              <h2>{album.title_en || album.title}</h2>
              {(album.description_en || album.description) && <p>{album.description_en || album.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
