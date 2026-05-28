import { mailConfigured, sendMail } from '../lib/mailer';

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3011';

const deliverEmail = async (to: string, subject: string, text: string) => {
  if (mailConfigured) await sendMail({ to, subject, text });
  else console.info(`[notify:email:dev] to=${to}\n${text}`);
};

const deliverSms = async (to: string, text: string) => {
  // TODO: when SMS_PROVIDER (e.g. MSG91/Twilio) is configured, send the real SMS here.
  console.info(`[notify:sms:dev] to=${to} ${text}`);
};

export const sendVerificationEmail = async (to: string, rawToken: string) => {
  const link = `${FRONTEND}/account/verify-email?token=${rawToken}`;
  await deliverEmail(to, 'Verify your email — Alliance Car Rental', `Verify your email: ${link}\nThis link expires in 1 hour.`);
};

export const sendResetEmail = async (to: string, rawToken: string) => {
  const link = `${FRONTEND}/account/reset?token=${rawToken}`;
  await deliverEmail(to, 'Reset your password — Alliance Car Rental', `Reset your password: ${link}\nThis link expires in 1 hour. If you didn't request this, ignore this email.`);
};

export const sendOtpSms = async (to: string, code: string) => {
  await deliverSms(to, `Your Alliance Car Rental verification code is ${code} (valid 10 minutes).`);
};
