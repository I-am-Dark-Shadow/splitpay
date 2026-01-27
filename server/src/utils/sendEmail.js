import nodemailer from 'nodemailer';

export const sendEmail = async ({ email, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false // ✅ Vercel fix
    }
  });

  await transporter.sendMail({
    from: `"SplitPay Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html
  });
};
