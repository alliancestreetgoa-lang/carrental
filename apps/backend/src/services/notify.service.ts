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

const deliverWhatsApp = async (to: string, text: string) => {
  // TODO: when WHATSAPP_TOKEN / Twilio is configured, send via the WhatsApp Cloud API / Twilio here.
  console.info(`[notify:whatsapp:dev] to=${to} ${text}`);
};

type Recipient = { fullName: string; email: string | null; mobile: string };
type BookingInfo = { id: string; car: { brand: string; carName: string }; pickupDate: Date; returnDate: Date };

const fmt = (d: Date) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

export const sendBookingConfirmation = async (to: Recipient, b: BookingInfo) => {
  const car = `${b.car.brand} ${b.car.carName}`;
  const msg = `Hi ${to.fullName}, your booking for ${car} (${fmt(b.pickupDate)} – ${fmt(b.returnDate)}) is received and pending approval. Ref: ${b.id}.`;
  if (to.email) await deliverEmail(to.email, 'Booking received — Alliance Car Rental', msg);
  await deliverWhatsApp(to.mobile, msg);
};

export const sendPaymentConfirmation = async (to: Recipient, amount: number, bookingId: string) => {
  const msg = `Hi ${to.fullName}, we received your payment of Rs. ${amount} for booking ${bookingId}. Thank you!`;
  if (to.email) await deliverEmail(to.email, 'Payment received — Alliance Car Rental', msg);
  await deliverWhatsApp(to.mobile, msg);
};

export const sendBookingDecision = async (to: Recipient, approved: boolean, reason?: string | null) => {
  const msg = approved
    ? `Hi ${to.fullName}, good news — your booking is APPROVED. See you soon!`
    : `Hi ${to.fullName}, unfortunately your booking was not approved.${reason ? ' Reason: ' + reason : ''}`;
  if (to.email) await deliverEmail(to.email, `Booking ${approved ? 'approved' : 'update'} — Alliance Car Rental`, msg);
  await deliverWhatsApp(to.mobile, msg);
};

// Scaffolds for a future scheduler (cron) to call — not wired to a trigger yet.
export const sendPickupReminder = async (to: Recipient, b: BookingInfo) => {
  const msg = `Reminder: your ${b.car.brand} ${b.car.carName} pickup is on ${fmt(b.pickupDate)}.`;
  if (to.email) await deliverEmail(to.email, 'Pickup reminder — Alliance Car Rental', msg);
  await deliverWhatsApp(to.mobile, msg);
};
export const sendReturnReminder = async (to: Recipient, b: BookingInfo) => {
  const msg = `Reminder: please return your ${b.car.brand} ${b.car.carName} by ${fmt(b.returnDate)}.`;
  if (to.email) await deliverEmail(to.email, 'Return reminder — Alliance Car Rental', msg);
  await deliverWhatsApp(to.mobile, msg);
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
