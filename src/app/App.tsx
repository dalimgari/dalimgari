import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";

export function App() {
  return (
    <div className="app-shell">
      <Header />
      <main id="main-content" aria-live="polite">
        <section aria-labelledby="migration-title">
          <p className="eyebrow">Migration preview</p>
          <h1 id="migration-title">ডালিমগাড়ী কমিউনিটি</h1>
          <p>
            This is an isolated React preview. The current production website remains unchanged
            while existing pages, authentication, gallery, and dashboard flows are migrated and
            tested.
          </p>
          <p>
            <Link to="/">Home preview</Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
