import React from 'react';
import { Link } from 'react-router-dom';

const LAST_UPDATED = '23 July 2026';

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '760px',
        margin: '0 auto',
        color: '#374151',
        lineHeight: 1.7,
        fontSize: '15px'
      }}>
        <Link to="/" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>← Back to ReportPilot</Link>

        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginTop: '20px', marginBottom: '4px' }}>Privacy Policy</h1>
        <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '28px' }}>Last updated: {LAST_UPDATED}</p>

        <p>
          ReportPilot ("we", "us", "our") is provided by Stuart Edgar, a sole trader based in Scotland, United Kingdom.
          This policy explains what data ReportPilot collects, why, and what happens to it. It applies to the ReportPilot
          web app at report-pilot.co.uk.
        </p>
        <p>
          We are registered with the UK Information Commissioner's Office (ICO registration number: <em>to be added
          once registration is confirmed</em>).
        </p>

        <h2 style={h2}>The short version</h2>
        <p>
          Pupil/student information you enter while writing reports — names, comments, attainment notes — stays on
          your own device in your browser's local storage. It is never sent to or stored on our servers. The one
          exception is the AI-assisted template builder: if you paste an existing report to help build a template,
          that text is sent to our AI provider to generate the template, then discarded — see "AI-assisted template
          building" below. The only information we hold about you on our servers is your teacher account details
          (name, email) and your subscription status.
        </p>

        <h2 style={h2}>What we collect</h2>
        <p><strong>Account data (stored on our servers, via Supabase, hosted in the EU):</strong> your name, email
          address, and subscription/billing status. This is the only personal data about you that we store.</p>
        <p><strong>Pupil/student data (stored only in your browser):</strong> class lists, pupil names, and any
          comments, notes or draft reports you write are saved to your browser's local storage. This data is not
          transmitted to or stored on our servers, and we cannot see it. It stays on the device you're using and is
          lost if you clear your browser data without exporting it — we'd encourage you to keep your own backups of
          anything important.</p>
        <p><strong>Payment data:</strong> if you subscribe to a paid plan, payment is handled directly by Stripe. We
          do not receive or store your card details — only your subscription status and plan.</p>

        <h2 style={h2}>AI-assisted template building</h2>
        <p>
          When you use "Create Section with AI" or "Find Statements with AI" to build a template from existing
          reports, the text you paste is sent from your browser to our AI processing partner, Anthropic, to generate
          the template. We do this because it's the only practical way to turn your own writing style into a
          reusable template.
        </p>
        <p>
          If the reports you paste include real pupil names, those names are included in what's sent to Anthropic for
          processing. Our system prompts Anthropic's model to strip all pupil names from the template it generates,
          so the resulting template never contains a real name — but the raw text you paste is, briefly, seen by the
          AI model in order to produce that result. You're welcome to replace names with something generic (like
          "Sam") yourself before pasting if you'd rather not send real names at all.
        </p>
        <p>
          We do not store the text you paste, and we do not use it to train any AI model. Anthropic processes API
          requests under its commercial API terms, which state that customer content submitted via the API is not
          used to train Anthropic's models, and is retained only briefly for abuse and safety monitoring. Because
          Anthropic is a US-based company, this involves a transfer of data outside the UK/EEA; this transfer is
          made under Anthropic's standard contractual data protection terms.
        </p>
        <p>
          <strong>A note if you're a teacher:</strong> pupil data usually belongs, in a data protection sense, to your
          school rather than to you personally. Please make sure using a third-party tool like ReportPilot to help
          draft reports is consistent with your school's data protection policy before pasting real pupil names into
          the AI-assisted builder. If you're unsure, using placeholder names is always a safe option — the app works
          exactly the same either way.
        </p>

        <h2 style={h2}>Why we process this data</h2>
        <p>
          We process your account data to provide the service you've signed up for (performance of a contract) and to
          meet our legal obligations (e.g. tax and accounting records). We process text you submit to the AI-assisted
          builder on the same basis — it's necessary to provide the specific feature you've chosen to use.
        </p>

        <h2 style={h2}>Who we share data with</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Supabase</strong> — hosts our database and authentication (EU region).</li>
          <li><strong>Anthropic</strong> — processes text you submit to AI-assisted features, as described above.</li>
          <li><strong>Stripe</strong> — handles payment processing for paid subscriptions.</li>
          <li><strong>Netlify</strong> — hosts the ReportPilot web app.</li>
        </ul>
        <p>We do not sell your data, or any pupil data, to anyone.</p>

        <h2 style={h2}>How long we keep data</h2>
        <p>
          We keep your account data for as long as your account is active, and for a reasonable period afterwards in
          case you return, or as required for our accounting and legal obligations. You can ask us to delete your
          account at any time (see "Your rights" below). Pupil data lives only in your browser, under your control —
          delete it any time by clearing that data within the app or your browser.
        </p>

        <h2 style={h2}>Your rights</h2>
        <p>
          Under UK GDPR, you have the right to access, correct, or delete the personal data we hold about you, to
          object to or restrict our processing of it, and to ask for a copy of it in a portable format. To exercise
          any of these rights, email us at hello@report-pilot.co.uk. You also have the right to complain to the ICO
          (ico.org.uk) if you think we've mishandled your data.
        </p>

        <h2 style={h2}>Security</h2>
        <p>
          We use industry-standard security practices, including encrypted connections (HTTPS) and Supabase's
          built-in access controls, to protect the account data we hold. No system is 100% secure, but keeping pupil
          data out of our servers entirely is a deliberate design choice that limits what could ever be exposed if
          something went wrong on our end.
        </p>

        <h2 style={h2}>Changes to this policy</h2>
        <p>
          We may update this policy from time to time — for example, if we add a new feature that changes what data
          we process. We'll update the "last updated" date above when we do. Significant changes will be flagged in
          the app.
        </p>

        <h2 style={h2}>Contact us</h2>
        <p>
          Questions about this policy or your data? Email hello@report-pilot.co.uk.
        </p>
      </div>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: '18px', fontWeight: 700, color: '#1e293b', marginTop: '28px', marginBottom: '8px' };
