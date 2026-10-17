export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="card">
      <p className="eyebrow">Privacy and data handling</p>
      <h1>Privacy by design</h1>
      <p className="lead">The application is being designed to collect as little personal information as practical.</p>
      <h2>Data handling</h2>
      <ul>
        <li>Account details are used to provide sign-in and account features.</li>
        <li>Profile details should be optional unless a feature clearly requires them.</li>
        <li>Private content must be protected by server-side authorization and database Row Level Security.</li>
        <li>Passwords are handled by the authentication provider and must never be stored in application tables or logs.</li>
        <li>Public pages and public media can be viewed by anyone; do not publish sensitive information in them.</li>
      </ul>
      <h2>Service providers</h2>
      <p>Hosting, database, authentication, and email services necessarily process technical data to operate the application. This project will not intentionally sell personal information or send it to advertising or analytics providers. Absolute secrecy from every service provider cannot be promised when hosted services are used.</p>
      <h2>Security</h2>
      <p>Security controls will be tested before production. No internet-connected system can guarantee zero risk, so access controls, dependency updates, backups, and incident recovery remain ongoing responsibilities.</p>
    </article>
  );
}
