export default function AuthPanel() {
  return (
    <a
      className="login-button"
      href={`${import.meta.env.BASE_URL}login`}
    >
      Login
    </a>
  );
}
