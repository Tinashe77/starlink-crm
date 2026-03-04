const nodemailer = require('nodemailer');

const emailPort = parseInt(process.env.EMAIL_PORT, 10);
const useSecureTransport = emailPort === 465;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: emailPort,
  secure: useSecureTransport,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    servername: process.env.EMAIL_HOST,
  },
});

const baseFont = 'Avenir Next, Segoe UI, Arial, sans-serif';

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatMoney = (value) => `USD ${Number(value || 0).toFixed(2)}`;

const renderDetailRows = (rows = []) =>
  rows
    .map(
      (row) => `
        <tr>
          <td style="padding: 12px 14px; background: #f8fbff; border-bottom: 1px solid #dce7f3; font-weight: 700; color: #173f8f; width: 38%;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding: 12px 14px; background: #ffffff; border-bottom: 1px solid #dce7f3; color: #334155;">
            ${row.html || escapeHtml(row.value || '')}
          </td>
        </tr>
      `
    )
    .join('');

const renderEmailShell = ({
  eyebrow = 'StarConnect Africa',
  title,
  intro,
  accent = 'linear-gradient(135deg,#173f8f 0%,#15a9e7 100%)',
  details = [],
  bodyHtml = '',
  cta,
  footerNote = 'This message was sent by the StarConnect Africa customer portal.',
}) => `
  <div style="margin: 0; padding: 24px 12px; background:
    radial-gradient(circle at top right, rgba(21,169,231,0.16), transparent 28%),
    radial-gradient(circle at top left, rgba(26,182,108,0.12), transparent 22%),
    #eef5fb; font-family: ${baseFont};">
    <div style="max-width: 660px; margin: 0 auto; background: #ffffff; border: 1px solid #dce7f3; border-radius: 28px; overflow: hidden; box-shadow: 0 28px 70px rgba(15,23,42,0.10);">
      <div style="background: ${accent}; padding: 28px 28px 26px; color: #ffffff;">
        <div style="display: inline-block; padding: 7px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.14);">
          ${escapeHtml(eyebrow)}
        </div>
        <h1 style="margin: 16px 0 0; font-size: 30px; line-height: 1.08; letter-spacing: -0.04em; font-weight: 700;">
          ${escapeHtml(title)}
        </h1>
        <p style="margin: 12px 0 0; font-size: 15px; line-height: 1.8; color: rgba(255,255,255,0.88);">
          ${intro}
        </p>
      </div>

      <div style="padding: 28px;">
        ${
          details.length
            ? `
              <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #dce7f3; border-radius: 20px; overflow: hidden; margin-bottom: 24px;">
                <tbody>
                  ${renderDetailRows(details)}
                </tbody>
              </table>
            `
            : ''
        }

        ${bodyHtml}

        ${
          cta
            ? `
              <div style="margin-top: 24px;">
                <a href="${escapeHtml(cta.href)}" style="display: inline-block; padding: 14px 22px; border-radius: 16px; background: linear-gradient(135deg,#173f8f 0%,#15a9e7 100%); color: #ffffff; text-decoration: none; font-weight: 700; box-shadow: 0 18px 34px rgba(23,63,143,0.20);">
                  ${escapeHtml(cta.label)}
                </a>
              </div>
            `
            : ''
        }
      </div>

      <div style="padding: 18px 28px 24px; border-top: 1px solid #dce7f3; background: linear-gradient(180deg,#ffffff 0%,#f8fbff 100%);">
        <p style="margin: 0; font-size: 12px; line-height: 1.7; color: #64748b;">
          ${footerNote}
        </p>
      </div>
    </div>
  </div>
`;

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.APP_URL}/reset-password/${resetToken}`;

  const html = renderEmailShell({
    eyebrow: 'Security',
    title: 'Reset Your Password',
    intro: `Hi ${escapeHtml(user.name)}, use the secure button below to set a new password. This reset link expires in <strong>1 hour</strong>.`,
    bodyHtml: `
      <div style="padding: 18px 20px; border-radius: 20px; border: 1px solid rgba(21,169,231,0.18); background: linear-gradient(180deg, rgba(21,169,231,0.06), rgba(21,169,231,0.02)); color: #475569; font-size: 14px; line-height: 1.8;">
        If you did not request this change, you can safely ignore this email and your current password will remain active.
      </div>
    `,
    cta: {
      href: resetUrl,
      label: 'Reset Password',
    },
    footerNote: 'For security reasons, password reset links expire automatically and should not be shared.',
  });

  await sendEmail({ to: user.email, subject: 'StarConnect Africa - Password Reset', html });
};

const sendWelcomeEmail = async (user, tempPassword) => {
  const loginUrl = `${process.env.APP_URL}/login`;

  const html = renderEmailShell({
    eyebrow: 'Welcome',
    title: 'Your Portal Account Is Ready',
    intro: `Hi ${escapeHtml(user.name)}, your StarConnect Africa portal account has been created. Sign in with the temporary password below, then update it immediately.`,
    details: [
      { label: 'Email', value: user.email },
      { label: 'Temporary Password', value: tempPassword },
      { label: 'Role', value: user.role },
    ],
    bodyHtml: `
      <div style="padding: 18px 20px; border-radius: 20px; border: 1px solid rgba(26,182,108,0.18); background: linear-gradient(180deg, rgba(26,182,108,0.08), rgba(26,182,108,0.02)); color: #475569; font-size: 14px; line-height: 1.8;">
        Your access level controls which modules you can use. If anything looks incorrect after login, contact the system administrator.
      </div>
    `,
    cta: {
      href: loginUrl,
      label: 'Log In To The Portal',
    },
    footerNote: 'This email contains access credentials. Keep it secure and do not forward it.',
  });

  await sendEmail({ to: user.email, subject: 'Welcome to StarConnect Africa', html });
};

const sendPaymentReceiptEmail = async ({
  customerName,
  email,
  receiptNumber,
  amount,
  contractRef,
  nextDueDate,
  nextDueAmount,
}) => {
  if (!email) return;

  const nextDueText = nextDueDate && nextDueAmount !== undefined
    ? `${new Date(nextDueDate).toLocaleDateString()} (${formatMoney(nextDueAmount)})`
    : 'No remaining installments';

  const html = renderEmailShell({
    eyebrow: 'Payments',
    title: 'Payment Received Successfully',
    intro: `Hi ${escapeHtml(customerName)}, we have recorded your installment payment successfully. Your statement and running balance have been updated in the portal.`,
    details: [
      { label: 'Receipt Number', value: receiptNumber },
      { label: 'Contract Reference', value: contractRef },
      { label: 'Amount Paid', value: formatMoney(amount) },
      { label: 'Next Payment Due', value: nextDueText },
    ],
    bodyHtml: `
      <div style="padding: 18px 20px; border-radius: 20px; border: 1px solid rgba(21,169,231,0.18); background: linear-gradient(180deg, rgba(21,169,231,0.06), rgba(21,169,231,0.02)); color: #475569; font-size: 14px; line-height: 1.8;">
        Thank you for staying current with your payment plan. You can log in at any time to view the latest payment tracking card and contract balance.
      </div>
    `,
  });

  await sendEmail({ to: email, subject: `Payment Receipt ${receiptNumber}`, html });
};

const sendPaymentReminderEmail = async ({
  customerName,
  email,
  contractRef,
  dueDate,
  amount,
  reminderType = 'Due Soon',
}) => {
  if (!email) return;

  const reminderCopy = {
    'Due Soon': {
      eyebrow: 'Upcoming Payment',
      title: 'Your Next Installment Is Due Soon',
      intro: 'This is a friendly reminder that your next installment is coming up shortly. Paying before the due date helps you avoid late status changes.',
      accent: 'linear-gradient(135deg,#173f8f 0%,#15a9e7 100%)',
    },
    'Due Today': {
      eyebrow: 'Due Today',
      title: 'Your Installment Is Due Today',
      intro: 'Your scheduled payment is due today. Please complete it today to keep your contract in good standing.',
      accent: 'linear-gradient(135deg,#173f8f 0%,#15a9e7 100%)',
    },
    Overdue: {
      eyebrow: 'Action Required',
      title: 'Your Installment Is Overdue',
      intro: 'Your scheduled payment is now overdue. Please complete it as soon as possible to avoid late fees or default status.',
      accent: 'linear-gradient(135deg,#ef3b35 0%,#f2bb2e 100%)',
    },
  };

  const content = reminderCopy[reminderType] || reminderCopy['Due Soon'];

  const html = renderEmailShell({
    eyebrow: content.eyebrow,
    title: content.title,
    intro: `Hi ${escapeHtml(customerName)}, ${content.intro}`,
    accent: content.accent,
    details: [
      { label: 'Contract Reference', value: contractRef },
      { label: 'Due Date', value: new Date(dueDate).toLocaleDateString() },
      { label: 'Amount Due', value: formatMoney(amount) },
      { label: 'Reminder Type', value: reminderType },
    ],
    bodyHtml: `
      <div style="padding: 18px 20px; border-radius: 20px; border: 1px solid rgba(21,169,231,0.18); background: linear-gradient(180deg, rgba(21,169,231,0.06), rgba(21,169,231,0.02)); color: #475569; font-size: 14px; line-height: 1.8;">
        You can review your live payment statement, outstanding balance, and next due information inside the customer portal at any time.
      </div>
    `,
  });

  await sendEmail({ to: email, subject: `${reminderType} Payment Reminder for ${contractRef}`, html });
};

const sendSupportTicketUpdateEmail = async ({
  customerName,
  email,
  ticketNumber,
  subjectLine,
  status,
  updatedBy,
  latestMessage,
}) => {
  if (!email) return;

  const html = renderEmailShell({
    eyebrow: 'Support',
    title: 'Your Ticket Has Been Updated',
    intro: `Hi ${escapeHtml(customerName)}, there is a new update on your support request. You can continue responding to the ticket in the portal until it is marked closed.`,
    details: [
      { label: 'Ticket Number', value: ticketNumber },
      { label: 'Subject', value: subjectLine },
      { label: 'Current Status', value: status },
      { label: 'Updated By', value: updatedBy },
    ],
    bodyHtml: `
      ${
        latestMessage
          ? `
            <div style="padding: 18px 20px; border-radius: 20px; border: 1px solid rgba(21,169,231,0.18); background: linear-gradient(180deg, rgba(21,169,231,0.06), rgba(21,169,231,0.02));">
              <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #15a9e7;">
                Latest Update
              </p>
              <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.8;">
                ${escapeHtml(latestMessage)}
              </p>
            </div>
          `
          : ''
      }
    `,
    footerNote: 'Ticket conversations remain open until the issue is resolved and the ticket is formally closed.',
  });

  await sendEmail({ to: email, subject: `Support Ticket Update ${ticketNumber}`, html });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPaymentReceiptEmail,
  sendPaymentReminderEmail,
  sendSupportTicketUpdateEmail,
};
