import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy and data handling information for the Dalimgari community website.",
};

export default function PrivacyPage() {
  return (
    <article className="card">
      <p className="eyebrow">Privacy and safety</p>
      <h1>Privacy</h1>
      <h2>Information we store</h2>
      <p>The application stores account details, profile information, and files that members or administrators choose to submit. Public pages and public media are visible to visitors. Private pages and private media are restricted by database and storage access policies.</p>
      <h2>Who processes technical data</h2>
      <p>The hosting provider and Supabase necessarily process technical information needed to deliver the website, authenticate accounts, and store data. This project does not intentionally add advertising trackers or third-party analytics.</p>
      <h2>External services</h2>
      <p>The village map opens an external map service only when a visitor chooses to open it. That service may receive ordinary connection information when visited.</p>
      <h2>Account safety</h2>
      <p>Use a unique password and do not share it. Administrators should grant elevated access only to trusted people. Public content should not contain private contact details or information that its owner did not intend to share.</p>
      <h2>Data requests</h2>
      <p>Contact a trusted site administrator to request account or profile corrections. Deleting content or an account may affect related pages, albums, or files.</p>
    </article>
  );
}
