import { ResetForm } from "./reset-form";

export const metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <section className="card">
      <h1>Choose a new password</h1>
      <p className="lead">Open this page using the password-reset link sent to your email.</p>
      <ResetForm />
    </section>
  );
}
