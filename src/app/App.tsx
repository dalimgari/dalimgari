import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "../services/supabase";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { AuthPage } from "../features/authentication/AuthPage";
import { HomePage } from "../features/home/HomePage";
import { ProfilePage } from "../features/profiles/ProfilePage";
import { EditProfilePage } from "../features/profiles/EditProfilePage";
import { GalleryPage } from "../features/gallery/GalleryPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { ContentManagerPage } from "../features/dashboard/ContentManagerPage";
import { SettingsManagerPage } from "../features/dashboard/SettingsManagerPage";
import { RoleManagerPage } from "../features/dashboard/RoleManagerPage";
import { UserManagerPage } from "../features/dashboard/UserManagerPage";
import { MediaLibraryPage } from "../features/media-library/MediaLibraryPage";

function NotFoundPage() {
  return (
    <section className="notice-card">
      <h1>Page not found</h1>
      <p>The address you opened could not be found.</p>
      <Link to="/">Return home</Link>
    </section>
  );
}

export function App() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        window.sessionStorage.setItem("dalimgari-password-recovery", "true");
        navigate("/forgot-password", { replace: true });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);
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
    case "/dashboard/user":
      content = <UserManagerPage />;
      break;
    case "/dashboard/role":
      content = <RoleManagerPage />;
      break;
    case "/dashboard/settings":
    case "/dashboard/customization":
      content = <SettingsManagerPage />;
      break;
    case "/dashboard/media-library":
      content = <MediaLibraryPage />;
      break;
    case "/dashboard":
      content = <DashboardPage />;
      break;
    default:
      if (pathname.startsWith("/albums/") && pathname.split("/").filter(Boolean).length === 2) {
        content = <GalleryPage />;
        break;
      }
      if (pathname.startsWith("/dashboard/")) {
        content = <ContentManagerPage />;
        break;
      }
      content = <NotFoundPage />;
  }

  return (
    <div className="app-shell">
      <Header />
      <main id="main-content" aria-live="polite">
        {content}
      </main>
      <Footer />
    </div>
  );
}
