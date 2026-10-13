import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { HomePage } from "../features/home/HomePage";

export function App() {
  return (
    <div className="app-shell">
      <Header />
      <main id="main-content" aria-live="polite">
        <HomePage />
      </main>
      <Footer />
    </div>
  );
}
