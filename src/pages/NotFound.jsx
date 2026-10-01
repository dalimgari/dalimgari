import { Layout } from '../components/layout'
import { Button } from '../components/ui'
import { appPath } from '../lib/routes'

export default function NotFound() {
  return (
    <Layout seoTitle="পেজ পাওয়া যায়নি">
      <section className="home-section">
        <div className="site-container empty-state">
          <h1>পেজ পাওয়া যায়নি</h1>
          <p>আপনি যে ঠিকানাটি খুঁজছেন সেটি পাওয়া যাচ্ছে না।</p>
          <Button as="a" href={appPath('/')}>হোমে ফিরে যান</Button>
        </div>
      </section>
    </Layout>
  )
}
