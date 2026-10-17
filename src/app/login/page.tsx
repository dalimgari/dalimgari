export const metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <section className="card">
      <h1>Login</h1>
      <p className="lead">Authentication setup is the next implementation step.</p>
      <form className="form">
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        <button className="button" type="button" disabled>
          Authentication not configured
        </button>
      </form>
    </section>
  );
}
