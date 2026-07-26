import React from 'react';
import { Link } from 'react-router-dom';

const LAST_UPDATED = '23 July 2026';

export default function Terms() {
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

        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginTop: '20px', marginBottom: '4px' }}>Terms of Service</h1>
        <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '28px' }}>Last updated: {LAST_UPDATED}</p>

        <p>
          These terms govern your use of ReportPilot, a web app provided by Stuart Edgar, a sole trader based in
          Scotland, United Kingdom, trading as ReportPilot ("we", "us"). By creating an account or using ReportPilot,
          you agree to these terms. If you don't agree, please don't use the app.
        </p>

        <h2 style={h2}>1. Who this is for</h2>
        <p>
          ReportPilot is intended for use by teachers and other education professionals for the purpose of drafting
          pupil/student reports. You must be at least 18 years old and acting in a professional capacity to use it.
        </p>

        <h2 style={h2}>2. Your account</h2>
        <p>
          You're responsible for keeping your login details secure and for anything that happens under your account.
          Let us know straight away at hello@report-pilot.co.uk if you think your account has been compromised.
        </p>

        <h2 style={h2}>3. Subscriptions and payment</h2>
        <p>
          ReportPilot offers a free tier with limited AI credit and report allowances, and paid subscription plans
          with expanded usage. Paid subscriptions are billed in advance and processed by Stripe. You can cancel a
          subscription at any time; cancellation takes effect at the end of the current billing period, and we don't
          offer refunds for partial periods except where required by law.
        </p>
        <p>
          We may change our pricing or plans from time to time. If we do, we'll give existing subscribers reasonable
          notice before any change takes effect on their next billing cycle.
        </p>

        <h2 style={h2}>4. Pupil data is your responsibility</h2>
        <p>
          Pupil/student information you enter is stored only in your browser, under your control — see our{' '}
          <Link to="/privacy" style={{ color: '#3b82f6' }}>Privacy Policy</Link> for details, including how the
          AI-assisted template builder handles text you paste. You're responsible for making sure your use of
          ReportPilot, including entering pupil names or details, complies with your school's own data protection
          policies. We're not able to see or control what you enter, since it never reaches our servers.
        </p>

        <h2 style={h2}>5. AI-generated content</h2>
        <p>
          ReportPilot uses AI to help build templates and generate report text from your own comment banks. AI output
          can be wrong, oddly phrased, or miss context an experienced teacher would catch. You're responsible for
          reading, checking, and editing anything ReportPilot produces before it goes into an actual report — treat it
          as a first draft from an assistant, not a finished, ready-to-send document.
        </p>

        <h2 style={h2}>6. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Use ReportPilot for anything unlawful, or in a way that could harm pupils, other users, or us;</li>
          <li>Try to reverse-engineer, scrape, or resell access to the service;</li>
          <li>Attempt to bypass usage limits, subscription gating, or security controls;</li>
          <li>Upload content you don't have the right to use.</li>
        </ul>
        <p>We may suspend or terminate accounts that breach these terms.</p>

        <h2 style={h2}>7. Your content</h2>
        <p>
          You own the templates, comments, and reports you create in ReportPilot. We claim no ownership over your
          content. Because pupil data and drafted reports live only in your browser, you're responsible for backing
          up anything you don't want to lose.
        </p>

        <h2 style={h2}>8. Service availability</h2>
        <p>
          We aim to keep ReportPilot running reliably, especially during busy report-writing periods, but we don't
          guarantee uninterrupted access. The service is provided "as is" without warranties of any kind, to the
          fullest extent permitted by law.
        </p>

        <h2 style={h2}>9. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, our total liability to you for any claim relating to ReportPilot is
          limited to the amount you've paid us in the 12 months before the claim arose. We're not liable for
          indirect losses, such as lost profits or lost data, except where liability cannot legally be limited or
          excluded (for example, in the case of fraud, or death or personal injury caused by our negligence).
        </p>

        <h2 style={h2}>10. Changes to these terms</h2>
        <p>
          We may update these terms occasionally — we'll update the "last updated" date above and flag significant
          changes in the app. Continuing to use ReportPilot after a change means you accept the updated terms.
        </p>

        <h2 style={h2}>11. Governing law</h2>
        <p>
          These terms are governed by the law of Scotland, and any disputes will be handled by the Scottish courts.
        </p>

        <h2 style={h2}>12. Contact</h2>
        <p>Questions about these terms? Email hello@report-pilot.co.uk.</p>
      </div>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: '18px', fontWeight: 700, color: '#1e293b', marginTop: '28px', marginBottom: '8px' };
