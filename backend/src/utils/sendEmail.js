import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter = null;

export const resetTransporter = () => { transporter = null; };

const getTransporter = async () => {
  if (transporter) return transporter;

  const host = config.smtpHost;

  // Gmail ke liye sirf service use karo
  if (host.includes('gmail.com')) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host,
      port: Number(config.smtpPort),
      secure: false,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  }

  try {
    await transporter.verify();
    console.log('✅ SMTP verified OK:', host);
  } catch (error) {
    console.error('❌ SMTP FAILED:', error.message);
  }

  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  const transport = await getTransporter();
  if (!transport) {
    console.error('❌ No transport available');
    return null;
  }

  try {
    const info = await transport.sendMail({
      from: config.smtpFrom || `"Mera Raasta" <${config.smtpUser}>`,
      to,
      subject,
      html,
    });

    console.log('✅ EMAIL SENT TO:', to);
    console.log('   Message ID:', info.messageId);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log('   Preview:', previewUrl);

    return { ...info, previewUrl };
  } catch (error) {
    console.error('❌ EMAIL FAILED:', error.message);
    throw error;
  }
};

/* ═══ Welcome Email Template ═══ */
export const welcomeEmail = (name, role) => {
  const roleColor = { student: '#3b82f6', parent: '#10b981', mentor: '#8b5cf6' };
  const roleLabel = { student: 'Student', parent: 'Parent', mentor: 'Mentor' };
  const color = roleColor[role] || '#3b82f6';
  const label = roleLabel[role] || 'User';

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <tr><td style="background:linear-gradient(135deg,${color},#6366f1);padding:40px 40px 30px;text-align:center;">
            <div style="width:70px;height:70px;background:rgba(255,255,255,0.2);border-radius:20px;display:inline-block;line-height:70px;font-size:32px;">🛤️</div>
            <h1 style="color:#ffffff;font-size:28px;margin:20px 0 8px;font-weight:800;">Welcome to Mera Raasta!</h1>
            <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">Your journey to the perfect career starts now</p>
          </td></tr>

          <tr><td style="padding:40px;">
            <p style="color:#334155;font-size:16px;line-height:1.7;margin:0 0 20px;">Hi <strong style="color:${color};font-size:18px;">${name}</strong>,</p>
            <p style="color:#475569;font-size:15px;line-height:1.8;margin:0 0 28px;">
              Congratulations! Your account has been successfully created as a <strong style="color:${color};">${label}</strong>. You're now part of India's smartest career guidance platform.
            </p>

            <div style="text-align:center;margin:30px 0;">
              <span style="display:inline-block;background:linear-gradient(135deg,${color},#6366f1);color:#fff;padding:12px 32px;border-radius:50px;font-size:14px;font-weight:700;letter-spacing:1px;box-shadow:0 4px 12px ${color}44;">
                🎉 YOU'RE A ${label.toUpperCase()}
              </span>
            </div>

            <div style="background:#f8fafc;border-radius:16px;padding:28px;margin:28px 0;border:1px solid #e2e8f0;">
              <p style="color:#1e293b;font-size:15px;font-weight:700;margin:0 0 16px;">Here's what you can do:</p>
              ${role === 'student' ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;color:#475569;font-size:14px;">🎯 Get AI-powered career recommendations</td></tr>
                <tr><td style="padding:8px 0;color:#475569;font-size:14px;">🗺️ Follow personalized career roadmaps</td></tr>
                <tr><td style="padding:8px 0;color:#475569;font-size:14px;">🤖 Chat with AI Career Coach 24/7</td></tr>
                <tr><td style="padding:8px 0;color:#475569;font-size:14px;">📄 Build professional resumes</td></tr>
                <tr><td style="padding:8px 0;color:#475569;font-size:14px;">📚 Explore courses, colleges & scholarships</td></tr>
              </table>` : role === 'parent' ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;color:#475569;font-size:14px;">👶 Add and track your children</td></tr>
                <tr><td style="padding:8px 0;color:#475569;font-size:14px;">📊 Monitor their career progress</td></tr>
                <tr><td style="padding:8px 0;color:#475569;font-size:14px;">🗺️ View their career roadmaps</td></tr>
                <tr><td style="padding:8px 0;color:#475569;font-size:14px;">🤖 Get AI guidance for family decisions</td></tr>
              </table>` : `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;color:#475569;font-size:14px;">🎓 Guide and mentor students</td></tr>
                <tr><td style="padding:8px 0;color:#475569;font-size:14px;">⭐ Review student progress & provide feedback</td></tr>
                <tr><td style="padding:8px 0;color:#475569;font-size:14px;">📊 Track student development</td></tr>
                <tr><td style="padding:8px 0;color:#475569;font-size:14px;">📚 Access education resources</td></tr>
              </table>`}
            </div>

            <div style="text-align:center;margin:36px 0;">
              <a href="http://localhost:5173/login" style="display:inline-block;background:linear-gradient(135deg,${color},#6366f1);color:#ffffff;padding:16px 40px;border-radius:14px;text-decoration:none;font-size:15px;font-weight:700;box-shadow:0 6px 20px ${color}44;">
                Go to Dashboard →
              </a>
            </div>

            <p style="color:#94a3b8;font-size:13px;text-align:center;margin:28px 0 0;line-height:1.6;">
              If you didn't create this account, please ignore this email.
            </p>
          </td></tr>

          <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;">© 2026 Mera Raasta — India's Smartest Career Guidance Platform</p>
            <p style="color:#cbd5e1;font-size:11px;margin:0;">This is an automated email. Please do not reply.</p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
};
