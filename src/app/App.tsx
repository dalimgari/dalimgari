import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";

export function App() {
  return (
    <>
      <Header />
      <main id="main-content" aria-live="polite">
        <section aria-labelledby="migration-title">
          <h1 id="migration-title">Dalimgari Community</h1>
          <p>The React application shell is being introduced incrementally.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
