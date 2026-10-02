import { Layout } from '../components/layout'
import { appPath } from '../lib/routes'

export default function AccessDenied() {
  return <Layout seoTitle="অ্যাক্সেস নেই">
    <section className="home-section"><div className="site-container">
      <article className="content-card content-card--detail">
        <h1>এই পেজে আপনার অ্যাক্সেস নেই</h1>
        <p>আপনার বর্তমান permission অনুযায়ী এই পেজটি দেখার অনুমতি নেই।</p>
        <a className="ui-button" href={appPath('/')}>হোমে ফিরে যান</a>
      </article>
    </div></section>
  </Layout>
}
