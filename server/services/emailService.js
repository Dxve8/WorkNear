const nodemailer = require('nodemailer');

let testTransporter;

const getTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
  }

  if (!testTransporter) {
    const account = await nodemailer.createTestAccount();
    testTransporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
  }

  return testTransporter;
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'WorkNear <no-reply@worknear.local>',
    to,
    subject: 'Reset your WorkNear password',
    text: `Hi ${name},\n\nReset your WorkNear password within 15 minutes: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Hi ${name},</p><p>Use the link below within 15 minutes to reset your WorkNear password.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });

  return nodemailer.getTestMessageUrl(info);
};

module.exports = { sendPasswordResetEmail };
