export default function Footer({ copyrightText = '© 2026. All rights reserved.' }) {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <p>{copyrightText}</p>
      </div>
    </footer>
  )
}
