import { Resend } from 'resend';
import { env } from '../config/env';

const placeholderValues = ['re_xxxx', 'placeholder', 'changeme', 'replace_me'];

const hasUsableResendKey = () => {
  const key = env.RESEND_API_KEY.trim().toLowerCase();

  if (!key) {
    return false;
  }

  return !placeholderValues.some((value) => key === value || key.includes(value));
};

const resend = hasUsableResendKey() ? new Resend(env.RESEND_API_KEY) : null;

const brandShell = (title: string, intro: string, body: string, ctaLabel: string, ctaUrl: string) => `
  <div style="background:#0b1120;padding:32px;font-family:Arial,sans-serif;color:#e5e7eb;">
    <div style="max-width:640px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:16px;overflow:hidden;">
      <div style="padding:24px 32px;border-bottom:1px solid #1f2937;">
        <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#60a5fa;font-weight:700;">ADFORT</div>
        <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;color:#f9fafb;">${title}</h1>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#d1d5db;">${intro}</p>
        <div style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#cbd5e1;">${body}</div>
        <a href="${ctaUrl}" style="display:inline-block;padding:14px 22px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;">${ctaLabel}</a>
      </div>
    </div>
  </div>
`;

const deliverEmail = async (to: string, subject: string, html: string) => {
  if (!resend) {
    console.log('[email:fallback]', JSON.stringify({ to, subject, html }, null, 2));
    return;
  }

  await resend.emails.send({
    from: env.FROM_EMAIL,
    to,
    subject,
    html
  });
};

export const sendVerificationEmail = async (to: string, token: string, userName: string) => {
  const verificationUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
  const html = brandShell(
    'Verify your email',
    `Hi ${userName}, welcome to ADFORT.`,
    'Please confirm your email address to activate your account and secure access to your dashboard.',
    'Verify email',
    verificationUrl
  );

  await deliverEmail(to, 'Verify your ADFORT email address', html);
};

export const sendPasswordResetEmail = async (to: string, token: string, userName: string) => {
  const resetUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  const html = brandShell(
    'Reset your password',
    `Hi ${userName}, we received a request to reset your ADFORT password.`,
    'Use the secure link below to choose a new password. If you did not request this, you can safely ignore this email.',
    'Reset password',
    resetUrl
  );

  await deliverEmail(to, 'Reset your ADFORT password', html);
};

export const sendReviewRequestEmail = async (to: string, businessName: string, reviewLink: string) => {
  const html = brandShell(
    'Share your experience',
    `Thanks for choosing ${businessName}.`,
    'We would love your feedback. A quick review helps other customers discover the business and supports continued growth.',
    'Leave a review',
    reviewLink
  );

  await deliverEmail(to, `How was your experience with ${businessName}?`, html);
};