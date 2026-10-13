export interface AlbumCardProps {
  title: string;
  description?: string;
  imageUrl?: string;
}

export function AlbumCard({ title, description, imageUrl }: AlbumCardProps) {
  return (
    <article className="album-card">
      {imageUrl ? <img src={imageUrl} alt="" loading="lazy" /> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </article>
  );
}
