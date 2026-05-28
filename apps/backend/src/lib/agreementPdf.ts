import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { company } from '../config/company';
import { getStrings } from './agreementStrings';

interface AgreementData {
  agreementNumber: string;
  signed: boolean;
  signedAt: Date | null;
  signatureData: string | null;
  signatoryName: string | null;
  booking: {
    pickupDate: Date;
    returnDate: Date;
    pickupLocation: string | null;
    dropLocation: string | null;
    totalAmount: unknown;
    securityDeposit: unknown;
    lateFee: unknown;
    payments?: { amount: unknown }[];
    customer: { fullName: string; mobile: string; email: string | null; licenseNumber: string; address: string | null };
    car: { carName: string; brand: string; model: string; registrationNumber: string; chassisNumber: string };
  };
}

const money = (n: unknown) => `$${Number(n).toFixed(2)}`;
const fmtDate = (d: Date | null) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const daysOf = (a: Date, b: Date) => Math.max(1, Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000));

const buildDoc = (a: AgreementData, lang: string | undefined) => {
  const s = getStrings(lang);
  const b = a.booking;
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  const left = 50;
  const right = 545;

  // ---- Branded header band ----
  doc.rect(0, 0, doc.page.width, 80).fill(company.darkColor);
  doc.rect(0, 80, doc.page.width, 4).fill(company.primaryColor);
  doc.fillColor('#ffffff').fontSize(22).text(company.name, left, 24);
  doc.fontSize(9).fillColor('#cbd5e1').text(company.tagline, left, 52);
  doc.fontSize(8).fillColor('#cbd5e1').text(`${company.phone}  ·  ${company.email}  ·  ${company.website}`, left, 64);

  doc.fillColor(company.darkColor).fontSize(15).text(s.title, left, 100);
  doc.fontSize(9).fillColor('#94a3b8')
    .text(`${s.agreementNo}: ${a.agreementNumber}`, left, 122)
    .text(`${s.date}: ${fmtDate(new Date())}`, left, 134);
  doc.y = 156;

  const heading = (txt: string) => doc.moveDown(0.4).fontSize(11).fillColor(company.darkColor).text(txt, { underline: true }).moveDown(0.2);
  const line = (txt: string) => doc.fontSize(10).fillColor('#334155').text(txt);

  // ---- Parties ----
  heading(s.lessor);
  line(company.name);
  company.addressLines.forEach(line);

  heading(s.lessee);
  line(b.customer.fullName);
  line(`${s.labels.mobile}: ${b.customer.mobile}`);
  line(`${s.labels.email}: ${b.customer.email ?? '—'}`);
  line(`${s.labels.licence}: ${b.customer.licenseNumber}`);
  line(`${s.labels.address}: ${b.customer.address ?? '—'}`);

  // ---- Vehicle ----
  heading(s.vehicle);
  line(`${b.car.brand} ${b.car.carName} (${b.car.model})`);
  line(`${s.labels.registration}: ${b.car.registrationNumber}`);
  line(`${s.labels.chassis}: ${b.car.chassisNumber}`);

  // ---- Rental period ----
  const days = daysOf(b.pickupDate, b.returnDate);
  heading(s.rentalTerms);
  line(`${s.labels.pickup}: ${fmtDate(b.pickupDate)}   ·   ${s.labels.ret}: ${fmtDate(b.returnDate)}   ·   ${days} ${s.labels.days}`);
  line(`${s.labels.pickupLoc}: ${b.pickupLocation ?? '—'}   ·   ${s.labels.dropLoc}: ${b.dropLocation ?? '—'}`);

  // ---- Charges breakdown ----
  const rent = Number(b.totalAmount);
  const lateFee = Number(b.lateFee);
  const dailyRate = rent / days;
  const grand = rent + lateFee;
  const paid = (b.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Math.max(0, grand - paid);

  heading(s.charges);
  const row = (label: string, value: string, bold = false) => {
    const y = doc.y;
    doc.fontSize(10).fillColor(bold ? company.darkColor : '#334155');
    doc.text(label, left, y);
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').text(value, right - 150, y, { width: 150, align: 'right' });
    doc.font('Helvetica');
    doc.moveDown(0.35);
  };
  row(`${s.labels.dailyRate} × ${days}`, money(dailyRate * days));
  row(s.labels.rentSubtotal, money(rent));
  row(s.labels.lateFee, money(lateFee));
  row(s.labels.grandTotal, money(grand), true);
  row(s.labels.paid, money(paid));
  row(s.labels.balanceDue, money(balance), true);
  row(s.labels.securityDeposit, money(b.securityDeposit));

  // ---- Terms ----
  heading(s.termsTitle);
  doc.fontSize(8.5).fillColor('#475569');
  s.terms.forEach((t, i) => doc.text(`${i + 1}. ${t}`, { paragraphGap: 2, align: 'justify' }));
  doc.moveDown(1.5);

  // ---- Signatures (lessee + lessor) ----
  const sigY = doc.y;
  doc.fontSize(10).fillColor(company.darkColor).text(`${s.lesseeSignature}:`, left, sigY);
  if (a.signed && a.signatureData) {
    try {
      const base64 = a.signatureData.replace(/^data:image\/\w+;base64,/, '');
      doc.image(Buffer.from(base64, 'base64'), left, sigY + 16, { fit: [170, 64] });
    } catch {
      doc.text('[signature on file]', left, sigY + 22);
    }
    doc.fontSize(8).fillColor('#64748b').text(`${s.signedBy} ${a.signatoryName ?? b.customer.fullName} · ${fmtDate(a.signedAt)}`, left, sigY + 84);
  } else {
    doc.moveTo(left, sigY + 56).lineTo(left + 180, sigY + 56).strokeColor('#94a3b8').stroke();
    doc.fontSize(8).fillColor('#94a3b8').text(s.notSigned, left, sigY + 60);
  }

  doc.fontSize(10).fillColor(company.darkColor).text(`${s.lessorSignature}:`, 330, sigY);
  doc.moveTo(330, sigY + 56).lineTo(510, sigY + 56).strokeColor('#94a3b8').stroke();

  // ---- Footer ----
  doc.fontSize(8).fillColor('#94a3b8').text(s.thanks, left, 780, { align: 'center', width: right - left });

  return doc;
};

export const streamAgreementPdf = (res: Response, a: AgreementData, lang?: string) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="agreement-${a.agreementNumber}.pdf"`);
  const doc = buildDoc(a, lang);
  doc.pipe(res);
  doc.end();
};

export const buildAgreementPdfBuffer = (a: AgreementData, lang?: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const doc = buildDoc(a, lang);
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
