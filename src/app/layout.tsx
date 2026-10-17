import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Dalimgari",
    template: "%s | Dalimgari",
  },
  description: "The digital community platform for Dalimgari village.",
  applicationName: "Dalimgari",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <a className="brand" href="/" aria-label="Dalimgari home">
              <span className="brand-mark" aria-hidden="true">D</span>
              <span>Dalimgari</span>
            </a>
            <nav aria-label="Main navigation">
              <a href="/">Home</a>
              <a href="/about">About</a>
              <a href="/login">Login</a>
            </nav>
          </header>
          <main id="main-content">{children}</main>
          <footer className="site-footer">
            <span>Dalimgari Community</span>
            <span>© {new Date().getFullYear()} Dalimgari</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
