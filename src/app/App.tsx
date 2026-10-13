import { Link, useLocation } from "react-router-dom";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { AuthPage } from "../features/authentication/AuthPage";
import { HomePage } from "../features/home/HomePage";
import { ProfilePage } from "../features/profiles/ProfilePage";
import { EditProfilePage } from "../features/profiles/EditProfilePage";
import { GalleryPage } from "../features/gallery/GalleryPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";

function NotFoundPage() {
  return (
    <section className="notice-card">
      <h1>পেজ পাওয়া যায়নি</h1>
      <p>আপনি যে ঠিকানাটি খুলেছেন সেটি পাওয়া যায়নি।</p>
      <Link to="/">হোমপেজে ফিরুন</Link>
    </section>
  );
}

export function App() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  let content;
  switch (pathname) {
    case "/":
      content = <HomePage />;
      break;
    case "/login":
      content = <AuthPage mode="login" />;
      break;
    case "/create-account":
      content = <AuthPage mode="create-account" />;
      break;
    case "/forgot-password":
      content = <AuthPage mode="forgot-password" />;
      break;
    case "/profile":
      content = <ProfilePage />;
      break;
    case "/profile/edit":
      content = <EditProfilePage />;
      break;
    case "/dashboard":
      content = <DashboardPage />;
      break;
    default:
      if (pathname.startsWith("/albums/") && pathname.split("/").filter(Boolean).length === 2) {
        content = <GalleryPage />;
        break;
      }
      content = <NotFoundPage />;
  }

  return (
    <div className="app-shell">
      <Header />
      <main id="main-content" aria-live="polite">{content}</main>
      <Footer />
    </div>
  );
}
