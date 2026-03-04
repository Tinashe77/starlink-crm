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

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #1a56db;">StarConnect CRM — Password Reset</h2>
      <p>Hi ${user.name},</p>
      <p>You requested a password reset. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}"
          style="background: #1a56db; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p>If you did not request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="color: #6b7280; font-size: 12px;">StarConnect CRM &mdash; Confidential</p>
    </div>
  `;

  await sendEmail({ to: user.email, subject: 'StarConnect CRM — Password Reset', html });
};

const sendWelcomeEmail = async (user, tempPassword) => {
  const loginUrl = `${process.env.APP_URL}/login`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #1a56db;">Welcome to StarConnect CRM</h2>
      <p>Hi ${user.name},</p>
      <p>Your account has been created. Use the credentials below to log in, then change your password immediately.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Email</td>
          <td style="padding: 8px; background: #f9fafb;">${user.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Temporary Password</td>
          <td style="padding: 8px; background: #f9fafb;">${tempPassword}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Role</td>
          <td style="padding: 8px; background: #f9fafb;">${user.role}</td>
        </tr>
      </table>
      <a href="${loginUrl}"
        style="background: #1a56db; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
        Log In Now
      </a>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="color: #6b7280; font-size: 12px;">StarConnect CRM &mdash; Confidential</p>
    </div>
  `;

  await sendEmail({ to: user.email, subject: 'Welcome to StarConnect CRM — Your Account Details', html });
};

const sendPaymentReceiptEmail = async ({ customerName, email, receiptNumber, amount, contractRef, nextDueDate, nextDueAmount }) => {
  if (!email) return;

  const nextDueText = nextDueDate && nextDueAmount !== undefined
    ? `<p><strong>Next Payment Due:</strong> ${new Date(nextDueDate).toLocaleDateString()} (USD ${Number(nextDueAmount).toFixed(2)})</p>`
    : '<p><strong>Next Payment Due:</strong> No remaining installments.</p>';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #1a56db;">StarConnect CRM — Payment Receipt</h2>
      <p>Hi ${customerName},</p>
      <p>We have recorded your installment payment successfully.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <tr><td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Receipt #</td><td style="padding: 8px; background: #f9fafb;">${receiptNumber}</td></tr>
        <tr><td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Contract</td><td style="padding: 8px; background: #f9fafb;">${contractRef}</td></tr>
        <tr><td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Amount Paid</td><td style="padding: 8px; background: #f9fafb;">USD ${Number(amount).toFixed(2)}</td></tr>
      </table>
      ${nextDueText}
      <p>Thank you for staying current with your payment plan.</p>
    </div>
  `;

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
      intro: 'This is a reminder that your next installment is due soon.',
      guidance: 'Please complete the payment before the due date to avoid late status.',
    },
    'Due Today': {
      intro: 'Your installment is due today.',
      guidance: 'Please complete the payment today to keep your contract in good standing.',
    },
    Overdue: {
      intro: 'Your installment is now overdue.',
      guidance: 'Please complete the payment as soon as possible to avoid default status and late fees.',
    },
  };

  const content = reminderCopy[reminderType] || reminderCopy['Due Soon'];

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #1a56db;">StarConnect CRM — Payment Reminder</h2>
      <p>Hi ${customerName},</p>
      <p>${content.intro}</p>
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <tr><td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Contract</td><td style="padding: 8px; background: #f9fafb;">${contractRef}</td></tr>
        <tr><td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Due Date</td><td style="padding: 8px; background: #f9fafb;">${new Date(dueDate).toLocaleDateString()}</td></tr>
        <tr><td style="padding: 8px; background: #f3f4f6; font-weight: bold;">Amount Due</td><td style="padding: 8px; background: #f9fafb;">USD ${Number(amount).toFixed(2)}</td></tr>
      </table>
      <p>${content.guidance}</p>
    </div>
  `;

  await sendEmail({ to: email, subject: `${reminderType} Payment Reminder for ${contractRef}`, html });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPaymentReceiptEmail,
  sendPaymentReminderEmail,
};
