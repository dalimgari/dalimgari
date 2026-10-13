import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="site-header" aria-label="Site header">
      <Link className="site-brand" to="/">ডালিমগাড়ী</Link>
      <span className="preview-label">React preview</span>
    </header>
  );
}
