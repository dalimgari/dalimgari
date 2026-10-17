import Image from "next/image";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function stringValue(value: unknown, keys: string[]) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const record = value as Record<string, unknown>;
  for (const key of keys) if (typeof record[key] === "string") return record[key] as string;
  return "";
}

function safeImageSource(value: string, projectUrl: string) {
  if (!value) return null;
  if (value.startsWith("/storage/v1/object/public/") && !value.startsWith("//")) {
    return `${projectUrl.replace(/\/$/, "")}${value}`;
  }
  try {
    const candidate = new URL(value);
    const project = new URL(projectUrl);
    if (candidate.protocol === "https:" && candidate.hostname === project.hostname) return candidate.toString();
  } catch {
    return null;
  }
  return null;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("albums").select("title,title_en").eq("url", slug).eq("visibility", "public").maybeSingle();
    if (data) return { title: data.title_en || data.title };
  } catch {
    // Metadata falls back to a generic title when configuration is unavailable.
  }
  return { title: "Gallery" };
}

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params;
  let album: { id: string; title: string; title_en: string | null; description: string | null; description_en: string | null } | null = null;
  let projectUrl = "";
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("albums")
      .select("id,title,title_en,description,description_en")
      .eq("url", slug)
      .eq("visibility", "public")
      .maybeSingle();
    if (error) throw error;
    album = data;
    projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  } catch {
    notFound();
  }
  if (!album) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: links } = await supabase.from("media_links")
    .select("sort_order,media_assets(id,title,title_en,original_filename,mime_type,storage_bucket,storage_path,visibility)")
    .eq("source_table", "albums")
    .eq("source_id", album.id)
    .order("sort_order", { ascending: true });

  const photos = (links ?? []).flatMap((link) => {
    const asset = link.media_assets;
    if (!asset || asset.visibility !== "public") return [];
    const publicUrl = supabase.storage.from(asset.storage_bucket).getPublicUrl(asset.storage_path).data.publicUrl;
    const src = safeImageSource(publicUrl, projectUrl);
    if (!src) return [];
    return [{ src, alt: asset.title_en || asset.title || album!.title_en || album!.title }];
  });

  return (
    <section>
      <p className="eyebrow">Community gallery</p>
      <h1>{album.title_en || album.title}</h1>
      {(album.description_en || album.description) && <p className="lead">{album.description_en || album.description}</p>}
      {photos.length === 0 ? (
        <article className="card"><p>No displayable public photographs are available in this album yet.</p></article>
      ) : (
        <div className="section-grid gallery-grid">
          {photos.map((photo, index) => (
            <figure className="card gallery-photo" key={`${photo.src}-${index}`}>
              <Image src={photo.src} alt={photo.alt} width={1200} height={800} unoptimized />
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
