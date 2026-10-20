// Sends mail through Brevo's HTTPS API (works on hosts that block SMTP ports).
// Uses the built-in fetch (Node 18+), so no extra package is needed.

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'

export default async function sendEmail({ to, subject, text, html }) {
  // Development fallback: no API key configured, print the email instead
  if (!process.env.BREVO_API_KEY) {
    if (process.env.NODE_ENV === 'production') throw new Error('Email is not configured')
    console.log(`\n[DEV EMAIL] To: ${to}\n${subject}\n${text}\n`)
    return
  }

  // The sender must be an address you verified in Brevo
  if (!process.env.EMAIL_FROM) throw new Error('EMAIL_FROM is not set')

  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: process.env.EMAIL_FROM_NAME || 'Weather Earth',
        email: process.env.EMAIL_FROM,
      },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(10000), // don't hang the request if Brevo is slow
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error('Brevo error:', res.status, detail) // full detail in the server log only
    throw new Error('Could not send email')
  }
}