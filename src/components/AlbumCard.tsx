import { Link } from "react-router-dom";

export interface AlbumCardProps {
  title: string;
  description?: string;
  imageUrl?: string;
  href?: string;
}

export function AlbumCard({ title, description, imageUrl, href }: AlbumCardProps) {
  const card = (
    <article className="album-card">
      {imageUrl ? <img src={imageUrl} alt="" loading="lazy" decoding="async" /> : null}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </article>
  );

  return href ? <Link className="album-card-link" to={href}>{card}</Link> : card;
}
