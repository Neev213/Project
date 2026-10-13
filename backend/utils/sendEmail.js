import nodemailer from 'nodemailer'

let transporter

// Created lazily: with ES modules, process.env isn't filled yet when imports run
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return transporter
}

export default async function sendEmail({ to, subject, text, html }) {
  // Development fallback: no SMTP configured, print the email instead
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === 'production') throw new Error('Email is not configured')
    console.log(`\n[DEV EMAIL] To: ${to}\n${subject}\n${text}\n`)
    return
  }
  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  })
}