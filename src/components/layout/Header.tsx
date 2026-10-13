import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="site-header" aria-label="Site header">
      <Link className="site-brand" to="/">
        ডালিমগাড়ী
      </Link>
      <nav className="site-navigation" aria-label="প্রধান নেভিগেশন">
        <Link to="/">হোম</Link>
        <Link to="/login">লগইন</Link>
        <Link to="/profile">প্রোফাইল</Link>
        <Link to="/dashboard">ড্যাশবোর্ড</Link>
      </nav>
      <span className="preview-label">React preview</span>
    </header>
  );
}
