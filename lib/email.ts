import { Resend } from 'resend';
import { getSitePath, getSiteUrl } from './site-url';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const isProduction = process.env.NODE_ENV === 'production';

// The sender email - this should ideally be an authenticated domain (e.g., hello@sciencedojo.co.uk)
const FROM_EMAIL = 'ScienceDojo <hello@sciencedojo.co.uk>';

type EmailSendResult =
  | { success: true; mock?: false; data: Awaited<ReturnType<Resend['emails']['send']>> }
  | { success: true; mock: true }
  | { success: false; mock?: false; error: unknown };

export function getEmailProviderStatus() {
  return {
    provider: 'resend',
    configured: Boolean(resendApiKey),
    mockMode: !resendApiKey && !isProduction,
    from: FROM_EMAIL,
  };
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailSendResult> {
  if (!resend) {
    if (isProduction) {
      const error = new Error('RESEND_API_KEY is missing. Production emails cannot be sent.');
      console.error('Failed to send email:', error.message);
      return { success: false, error };
    }

    console.log('\n--- 📧 MOCK EMAIL SENT ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (HTML length): ${html.length} bytes`);
    console.log(html);
    console.log('----------------------------\n');
    return { success: true, mock: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

export async function sendInternalTeamInviteEmail({
  to,
  name,
  role,
  title,
  temporaryPassword,
  resetLink,
}: {
  to: string;
  name: string;
  role: string;
  title?: string | null;
  temporaryPassword: string;
  resetLink: string;
}) {
  const loginUrl = getSitePath('/login/internal');
  const safeName = escapeHtml(name || 'Team member');
  const safeRole = escapeHtml(role.replace(/_/g, ' '));
  const safeTitle = escapeHtml(title || role.replace(/_/g, ' '));
  const safePassword = escapeHtml(temporaryPassword);
  const safeResetLink = escapeHtml(resetLink);

  const html = `
    <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; color: #06172f; background: #ffffff;">
      <div style="padding: 32px 28px; border: 1px solid #e5eaf2; border-radius: 24px; background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);">
        <div style="margin: 0 0 24px; display: flex; align-items: center; gap: 10px;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 999px; background: #0066ff;"></span>
          <span style="color: #06172f; font-size: 16px; font-weight: 900; letter-spacing: 0.18em;">SCIENCEDOJO</span>
        </div>
        <p style="margin: 0 0 14px; color: #0066ff; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase;">ScienceDojo Internal Team</p>
        <h1 style="margin: 0; font-size: 30px; line-height: 1.15; letter-spacing: -0.03em; color: #06172f;">Welcome to ScienceDojo, ${safeName}.</h1>
        <p style="margin: 18px 0 0; color: #42526b; font-size: 16px; line-height: 1.7;">
          I am glad to have you helping with ScienceDojo. Your limited internal team access has been created for your ${safeTitle} role.
        </p>

        <div style="margin: 26px 0; padding: 20px; border-radius: 18px; background: #ffffff; border: 1px solid #e5eaf2;">
          <p style="margin: 0 0 10px; color: #06172f; font-size: 15px; font-weight: 800;">Temporary password</p>
          <p style="margin: 0; padding: 14px 16px; border-radius: 12px; background: #f1f5f9; color: #06172f; font-size: 18px; font-weight: 900; letter-spacing: 0.08em;">${safePassword}</p>
          <p style="margin: 12px 0 0; color: #64748b; font-size: 13px; line-height: 1.6;">
            Please reset this password before using the account for regular internal work.
          </p>
        </div>

        <div style="margin: 28px 0 12px;">
          <a href="${loginUrl}" style="display: inline-block; background: #0066ff; color: #ffffff; padding: 14px 22px; border-radius: 999px; font-weight: 800; text-decoration: none;">Log in to ScienceDojo Internal</a>
        </div>

        <div style="margin: 0 0 18px;">
          <a href="${safeResetLink}" style="display: inline-block; background: #e8f1ff; color: #0066ff; padding: 12px 18px; border-radius: 999px; font-weight: 800; text-decoration: none;">Set or reset password</a>
        </div>

        <p style="margin: 0 0 12px; color: #42526b; font-size: 13px; line-height: 1.7;">
          For security, please set your own password before using the account for regular work.
        </p>

        <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.7;">
          Internal role: <strong style="color: #06172f; text-transform: capitalize;">${safeRole}</strong>. This account does not grant public tutor access or full admin access.
        </p>

        <p style="margin: 14px 0 0; color: #94a3b8; font-size: 12px; line-height: 1.6;">
          If the password button does not work, paste this link into your browser:<br />
          <a href="${safeResetLink}" style="color: #0066ff; text-decoration: none;">${safeResetLink}</a>
        </p>

        <p style="margin: 24px 0 0; color: #06172f; font-size: 15px; line-height: 1.7;">
          Welcome aboard,<br />
          <strong>Piumal</strong>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'Your ScienceDojo internal team access',
    html,
  });
}

// ==========================================
// Specific Email Templates
// ==========================================

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendTutorAcceptedEmail(tutorEmail: string, tutorName: string) {
  const siteUrl = getSiteUrl();
  const safeName = escapeHtml(tutorName || 'Tutor');

  const html = `
    <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; color: #06172f; background: #ffffff;">
      <div style="padding: 32px 28px; border: 1px solid #e5eaf2; border-radius: 24px; background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);">
        <p style="margin: 0 0 14px; color: #0066ff; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase;">ScienceDojo Tutor Network</p>
        <h1 style="margin: 0; font-size: 30px; line-height: 1.15; letter-spacing: -0.03em; color: #06172f;">Welcome to ScienceDojo, ${safeName}.</h1>
        <p style="margin: 18px 0 0; color: #42526b; font-size: 16px; line-height: 1.7;">
          Congratulations — your tutor application has been accepted. You are now part of our verified tutor network.
        </p>

        <div style="margin: 26px 0; padding: 20px; border-radius: 18px; background: #ffffff; border: 1px solid #e5eaf2;">
          <p style="margin: 0 0 12px; color: #06172f; font-size: 15px; font-weight: 800;">Next goal: launch your tutor profile</p>
          <ul style="margin: 0; padding-left: 20px; color: #42526b; font-size: 14px; line-height: 1.8;">
            <li>Complete your public tutor profile.</li>
            <li>Set your availability for student requests.</li>
            <li>Connect payments so payouts can be handled smoothly.</li>
            <li>Review the Tutor Guide Hub before your first lesson.</li>
          </ul>
        </div>

        <div style="margin: 28px 0 20px;">
          <a href="${siteUrl}/dashboard/tutor/settings" style="display: inline-block; background: #0066ff; color: #ffffff; padding: 14px 22px; border-radius: 999px; font-weight: 800; text-decoration: none;">Complete your tutor profile</a>
        </div>

        <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.7;">
          Need guidance? The <a href="${siteUrl}/support/tutors" style="color: #0066ff; font-weight: 700; text-decoration: none;">Tutor Guide Hub</a> explains profile setup, bookings, payments, safeguarding, and what to expect as you begin teaching on ScienceDojo.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: tutorEmail,
    subject: 'Welcome to ScienceDojo — your tutor application has been accepted',
    html,
  });
}

export async function sendBookingRequestedEmail(tutorEmail: string, studentName: string, date: Date, subject: string) {
  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
      <h2 style="color: #1e293b;">New Booking Request</h2>
      <p>Hello,</p>
      <p><strong>${studentName}</strong> has requested a lesson for <strong>${subject}</strong> on ${date.toLocaleString()}.</p>
      <p>Please log in to your dashboard to accept or decline the session.</p>
      <br/>
      <a href="${getSitePath('/dashboard/tutor')}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Request</a>
    </div>
  `;
  return sendEmail({ to: tutorEmail, subject: `New Booking Request from ${studentName}`, html });
}

export async function sendBookingAcceptedEmail(studentEmail: string, tutorName: string, date: Date) {
  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Session Accepted!</h2>
      <p>Hello,</p>
      <p>Great news! <strong>${tutorName}</strong> has accepted your lesson request for ${date.toLocaleString()}.</p>
      <p>Please log in to your dashboard to complete the mandatory payment to confirm the session.</p>
      <br/>
      <a href="${getSitePath('/dashboard/student')}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Complete Payment</a>
    </div>
  `;
  return sendEmail({ to: studentEmail, subject: `Your session with ${tutorName} is accepted`, html });
}

export async function sendLessonNotesEmail(studentEmail: string, tutorName: string, date: Date, summary: string, homework: string) {
  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Lesson Recap & Homework</h2>
      <p>Hello,</p>
      <p>Here is your recap from the session on ${date.toLocaleDateString()} with <strong>${tutorName}</strong>:</p>
      
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
        <h4 style="margin-top: 0; color: #3b82f6; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">What was covered</h4>
        <p style="margin-bottom: 0;">${summary}</p>
      </div>

      <div style="background-color: #fffbeb; padding: 16px; border-radius: 12px; border: 1px solid #fef3c7;">
        <h4 style="margin-top: 0; color: #d97706; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Homework / Next Steps</h4>
        <p style="margin-bottom: 0;">${homework || 'None assigned.'}</p>
      </div>

      <p style="margin-top: 32px; font-size: 14px; color: #64748b;">You can review this anytime in your ScienceDojo dashboard.</p>
    </div>
  `;
  return sendEmail({ to: studentEmail, subject: `Lesson Recap from ${tutorName}`, html });
}
