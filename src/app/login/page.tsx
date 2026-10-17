import { AuthForm } from "./auth-form";

export const metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <section className="card">
      <h1>Community account</h1>
      <p className="lead">Sign in, create an account, or request a password-reset link.</p>
      <AuthForm />
    </section>
  );
}
