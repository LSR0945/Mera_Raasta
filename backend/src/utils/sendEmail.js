import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { config } from '../config/env.js';

let transporter = null;
let resendClient = null;

export const resetTransporter = () => { transporter = null; };

const getResend = () => {
  if (!config.resendApiKey) return null;
  if (!resendClient) resendClient = new Resend(config.resendApiKey);
  return resendClient;
};

const getTransporter = () => {
  if (transporter) return transporter;

  const host = config.smtpHost;

  if (host.includes('gmail.com')) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass ? String(config.smtpPass).replace(/\s+/g, '') : '',
      },
      connectionTimeout: 3000,
      greetingTimeout: 3000,
      socketTimeout: 3500,
    });
  } else {
    transporter = nodemailer.createTransport({
      host,
      port: Number(config.smtpPort),
      secure: Number(config.smtpPort) === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass ? String(config.smtpPass).replace(/\s+/g, '') : '',
      },
      connectionTimeout: 3000,
      greetingTimeout: 3000,
      socketTimeout: 3500,
    });
  }

  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  const from = config.smtpFrom || (config.smtpUser ? `"Mera Raasta" <${config.smtpUser}>` : 'Mera Raasta <onboarding@resend.dev>');

  // 1. Prefer Resend HTTP API (port 443, fast & never blocked on Render)
  const resend = getResend();
  if (resend) {
    const { data, error } = await resend.emails.send({
      from: config.smtpFrom || 'Mera Raasta <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
    if (error) {
      console.error('❌ RESEND FAILED:', error.message);
      throw new Error(error.message);
    }
    console.log('✅ EMAIL SENT (Resend) TO:', to, 'ID:', data?.id);
    return data;
  }

  // 2. Fast-fail if SMTP credentials are missing
  if (!config.smtpUser || !config.smtpPass) {
    throw new Error('Email service not configured (set RESEND_API_KEY or SMTP credentials)');
  }

  // 3. Fallback to SMTP with hard 3.5s timeout so registration never hangs
  try {
    const transport = getTransporter();
    const info = await Promise.race([
      transport.sendMail({ from, to, subject, html }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout (3.5s)')), 3500)),
    ]);
    console.log('✅ EMAIL SENT (SMTP) TO:', to, 'Message ID:', info.messageId);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    return { ...info, previewUrl };
  } catch (error) {
    console.error('❌ EMAIL FAILED (SMTP):', error.message);
    resetTransporter();
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
                <tr><td style="padding:8px 0;color:#475569;font-size:14px;">🤖 Chat with AI Agent 24/7</td></tr>
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

/* ===== Email Verification Template ===== */
// Register ke baad bheja jata hai. Button click -> frontend /verify-email?token=...
export const verificationEmail = (name, verifyUrl) => {
  const safeName = String(name || 'there').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <tr><td style="background:linear-gradient(135deg,#2563eb,#6366f1);padding:40px;text-align:center;">
            <h1 style="color:#ffffff;font-size:26px;margin:0 0 8px;font-weight:800;">Verify your email</h1>
            <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">One click and your Mera Raasta account is ready</p>
          </td></tr>

          <tr><td style="padding:40px;">
            <p style="color:#334155;font-size:16px;line-height:1.7;margin:0 0 16px;">Hi <strong style="color:#2563eb;">${safeName}</strong>,</p>
            <p style="color:#475569;font-size:15px;line-height:1.8;margin:0 0 28px;">
              Thanks for signing up on <strong>Mera Raasta</strong>. Please confirm your email address by clicking the button below.
            </p>

            <div style="text-align:center;margin:32px 0;">
              <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#6366f1);color:#ffffff;padding:16px 42px;border-radius:12px;text-decoration:none;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(37,99,235,0.35);">
                Verify Email & Open Website
              </a>
            </div>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin:24px 0;">
              <p style="color:#64748b;font-size:12px;line-height:1.7;margin:0;">
                Button kaam na kare to ye link browser me paste karein:<br>
                <a href="${verifyUrl}" style="color:#2563eb;word-break:break-all;">${verifyUrl}</a>
              </p>
            </div>

            <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
              Ye link <strong>24 ghante</strong> tak valid hai. Agar aapne account nahi banaya, is email ko ignore kar dein.
            </p>
          </td></tr>

          <tr><td style="background:#f8fafc;padding:22px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">&copy; 2026 Mera Raasta &mdash; India's Smartest Career Guidance Platform</p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
};

/* ===== OTP Verification Template ===== */
// Register ke baad bheja jata hai — 6-digit code user website par enter karta hai
export const otpEmail = (name, otp) => {
  const safeName = String(name || 'there').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
  const safeOtp = String(otp).replace(/\D/g, '');

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <tr><td style="background:linear-gradient(135deg,#2563eb,#6366f1);padding:40px;text-align:center;">
            <h1 style="color:#ffffff;font-size:26px;margin:0 0 8px;font-weight:800;">Verify your email</h1>
            <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Enter this code on Mera Raasta to activate your account</p>
          </td></tr>

          <tr><td style="padding:40px;">
            <p style="color:#334155;font-size:16px;line-height:1.7;margin:0 0 16px;">Hi <strong style="color:#2563eb;">${safeName}</strong>,</p>
            <p style="color:#475569;font-size:15px;line-height:1.8;margin:0 0 28px;">
              Aapka verification code neeche diya gaya hai. Website par ye <strong>6-digit OTP</strong> enter karein:
            </p>

            <div style="text-align:center;margin:32px 0;">
              <span style="display:inline-block;background:#f8fafc;border:2px dashed #cbd5e1;border-radius:16px;padding:22px 46px;font-size:44px;font-weight:800;letter-spacing:14px;color:#1e293b;font-family:Consolas,'Courier New',monospace;">${safeOtp}</span>
            </div>

            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;margin:24px 0;">
              <p style="color:#9a3412;font-size:13px;line-height:1.7;margin:0;">
                &#9200; Ye OTP <strong>10 minute</strong> tak valid hai. Kisi ko bhi share na karein — Mera Raasta kabhi OTP nahi maangta.
              </p>
            </div>

            <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
              Agar aapne account nahi banaya, to ye email ignore kar dein.
            </p>
          </td></tr>

          <tr><td style="background:#f8fafc;padding:22px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">&copy; 2026 Mera Raasta &mdash; India's Smartest Career Guidance Platform</p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
};
