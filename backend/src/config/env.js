import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: join(__dirname, '..', '..', '.env') });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'access_secret_key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_key',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  // Frontend ka public URL — verification email ke link me use hota hai
  clientUrl: process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
  smtpHost: process.env.SMTP_HOST || 'smtp.ethereal.email',
  smtpPort: process.env.SMTP_PORT || '587',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || '',
  // Optional HTTP email providers (SMTP ke alawa)
  resendApiKey: process.env.RESEND_API_KEY || '',
  brevoApiKey: process.env.BREVO_API_KEY || '',
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  // Google Apps Script Gmail relay — zero signup, user ke Gmail se email jata hai
  gasEmailUrl: process.env.GAS_EMAIL_URL || '',
  gasEmailSecret: process.env.GAS_EMAIL_SECRET || '',
};
