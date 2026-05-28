import PDFDocument from 'pdfkit';
import { Response } from 'express';

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
    customer: { fullName: string; mobile: string; email: string | null; licenseNumber: string; address: string | null };
    car: { carName: string; brand: string; model: string; registrationNumber: string; chassisNumber: string };
  };
}

const money = (n: unknown) => `$${Number(n).toFixed(2)}`;
const fmtDate = (d: Date | null) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const days = (a: Date, b: Date) => Math.max(1, Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000));

const TERMS = [
  'The Lessee confirms they hold a valid driving licence and are legally permitted to operate the vehicle.',
  'The vehicle must be returned by the agreed return date and time; late returns incur a late fee equal to the daily rate per extra day.',
  'The security deposit is refundable on return, subject to deductions for damage, fines, or fuel shortfalls.',
  'The Lessee is responsible for all traffic violations, tolls and fines during the rental period.',
  'The vehicle shall not be sub-let, used for racing, or driven under the influence of alcohol or drugs.',
  'Any damage, accident or theft must be reported to the Lessor immediately.',
];

export const streamAgreementPdf = (res: Response, a: AgreementData) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="agreement-${a.agreementNumber}.pdf"`);
  doc.pipe(res);

  const b = a.booking;

  doc.fontSize(20).fillColor('#1e293b').text('Alliance Car Rental');
  doc.fontSize(12).fillColor('#0f172a').text('Vehicle Rental Agreement');
  doc.fontSize(9).fillColor('#94a3b8').text(`Agreement No: ${a.agreementNumber}`);
  doc.text(`Date: ${fmtDate(new Date())}`);
  doc.moveDown();

  doc.fontSize(11).fillColor('#0f172a').text('Lessor', { underline: true });
  doc.fontSize(10).fillColor('#334155').text('Alliance Car Rental').text('Goa, India');
  doc.moveDown(0.5);

  doc.fontSize(11).fillColor('#0f172a').text('Lessee', { underline: true });
  doc.fontSize(10).fillColor('#334155')
    .text(b.customer.fullName)
    .text(`Mobile: ${b.customer.mobile}`)
    .text(`Email: ${b.customer.email ?? '—'}`)
    .text(`Licence: ${b.customer.licenseNumber}`)
    .text(`Address: ${b.customer.address ?? '—'}`);
  doc.moveDown(0.5);

  doc.fontSize(11).fillColor('#0f172a').text('Vehicle', { underline: true });
  doc.fontSize(10).fillColor('#334155')
    .text(`${b.car.brand} ${b.car.carName} (${b.car.model})`)
    .text(`Registration: ${b.car.registrationNumber}`)
    .text(`Chassis: ${b.car.chassisNumber}`);
  doc.moveDown(0.5);

  doc.fontSize(11).fillColor('#0f172a').text('Rental Terms', { underline: true });
  doc.fontSize(10).fillColor('#334155')
    .text(`Pickup: ${fmtDate(b.pickupDate)}  ·  Return: ${fmtDate(b.returnDate)}  ·  ${days(b.pickupDate, b.returnDate)} day(s)`)
    .text(`Pickup Location: ${b.pickupLocation ?? '—'}  ·  Drop Location: ${b.dropLocation ?? '—'}`)
    .text(`Rental Amount: ${money(b.totalAmount)}  ·  Security Deposit: ${money(b.securityDeposit)}`);
  doc.moveDown();

  doc.fontSize(11).fillColor('#0f172a').text('Terms & Conditions', { underline: true });
  doc.fontSize(9).fillColor('#475569');
  TERMS.forEach((t, i) => doc.text(`${i + 1}. ${t}`, { paragraphGap: 2 }));
  doc.moveDown(2);

  // Signature block
  const y = doc.y;
  doc.fontSize(10).fillColor('#0f172a').text('Lessee Signature:', 50, y);
  if (a.signed && a.signatureData) {
    try {
      const base64 = a.signatureData.replace(/^data:image\/\w+;base64,/, '');
      const buf = Buffer.from(base64, 'base64');
      doc.image(buf, 50, y + 16, { fit: [180, 70] });
    } catch {
      doc.text('[signature on file]', 50, y + 20);
    }
    doc.fontSize(9).fillColor('#64748b').text(`Signed by ${a.signatoryName ?? b.customer.fullName} on ${fmtDate(a.signedAt)}`, 50, y + 92);
  } else {
    doc.moveTo(50, y + 60).lineTo(250, y + 60).strokeColor('#94a3b8').stroke();
    doc.fontSize(9).fillColor('#94a3b8').text('Not yet signed', 50, y + 66);
  }

  doc.end();
};
