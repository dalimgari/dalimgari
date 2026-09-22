import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function App() {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const checkConnection = async () => {
      const { error } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1)

      setConnected(!error)
    }

    checkConnection()
  }, [])

  return (
    <div className="app">
      <header className="header">
        <div className="container header-content">
          <a className="logo" href="/">
            Dalimgari
          </a>

          <nav className="nav">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#community">Community</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="container">
            <p className="eyebrow">Village Community</p>
            <h1>Welcome to Dalimgari</h1>
            <p className="hero-text">
              A modern digital platform for the Dalimgari village community.
            </p>
            <a className="button" href="#community">
              Explore Community
            </a>
          </div>
        </section>

        <section id="about" className="section">
          <div className="container">
            <h2>About Dalimgari</h2>
            <p>
              This website will bring village information, community services,
              announcements, and useful resources together in one place.
            </p>
          </div>
        </section>

        <section id="community" className="section section-alt">
          <div className="container">
            <h2>Community</h2>

            <div className="cards">
              <article className="card">
                <h3>Announcements</h3>
                <p>Important community announcements will appear here.</p>
              </article>

              <article className="card">
                <h3>Village Services</h3>
                <p>Useful local services and information will be available here.</p>
              </article>

              <article className="card">
                <h3>Community Members</h3>
                <p>Community features will be connected to Supabase.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="contact" className="section">
          <div className="container">
            <h2>Contact</h2>
            <p>Community contact information will be added here.</p>

            <div className={`status ${connected ? 'online' : 'offline'}`}>
              Supabase: {connected ? 'Connected' : 'Not connected'}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>Dalimgari Community</p>
        </div>
      </footer>
    </div>
  )
}

export default App
