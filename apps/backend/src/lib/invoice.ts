import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface InvoiceData {
  id: string;
  pickupDate: Date;
  returnDate: Date;
  actualReturnDate: Date | null;
  totalDays: number;
  customer: { fullName: string; mobile: string; email: string | null };
  car: { carName: string; brand: string; registrationNumber: string };
  invoice: {
    rentTotal: number;
    lateFee: number;
    grandTotal: number;
    securityDeposit: number;
    advancePayment: number;
    paymentsReceived: number;
    balanceDue: number;
  };
}

const inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (n: number) => `Rs. ${inr.format(n)}`;
const fmtDate = (d: Date | null) => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

export const streamInvoicePdf = (res: Response, b: InvoiceData) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${b.id}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).fillColor('#1e293b').text('Alliance Car Rental', { continued: false });
  doc.fontSize(10).fillColor('#64748b').text('Rental Invoice');
  doc.moveDown();
  doc.fontSize(9).fillColor('#94a3b8').text(`Invoice #: ${b.id}`);
  doc.text(`Issued: ${fmtDate(new Date())}`);
  doc.moveDown();

  // Bill to + vehicle
  doc.fillColor('#0f172a').fontSize(11).text('Bill To', { underline: true });
  doc.fontSize(10).fillColor('#334155')
    .text(b.customer.fullName)
    .text(b.customer.mobile)
    .text(b.customer.email ?? '');
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#0f172a').text('Vehicle', { underline: true });
  doc.fontSize(10).fillColor('#334155')
    .text(`${b.car.brand} ${b.car.carName}`)
    .text(`Reg: ${b.car.registrationNumber}`);
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#334155')
    .text(`Pickup: ${fmtDate(b.pickupDate)}`)
    .text(`Scheduled Return: ${fmtDate(b.returnDate)}`)
    .text(`Actual Return: ${fmtDate(b.actualReturnDate)}`)
    .text(`Rental Days: ${b.totalDays}`);
  doc.moveDown();

  // Charges table
  const line = (label: string, value: string, bold = false) => {
    doc.fontSize(10).fillColor(bold ? '#0f172a' : '#334155');
    const y = doc.y;
    doc.text(label, 50, y);
    doc.text(value, 400, y, { width: 145, align: 'right' });
    doc.moveDown(0.4);
  };

  doc.fontSize(12).fillColor('#0f172a').text('Charges', { underline: true });
  doc.moveDown(0.4);
  line('Rental charge', money(b.invoice.rentTotal));
  line('Late fee', money(b.invoice.lateFee));
  line('Grand total', money(b.invoice.grandTotal), true);
  doc.moveDown(0.4);
  line('Payments received', money(b.invoice.paymentsReceived), true);
  line('Balance due', money(b.invoice.balanceDue), true);
  doc.moveDown(0.4);
  line('Security deposit (refundable)', money(b.invoice.securityDeposit));

  doc.moveDown(2);
  doc.fontSize(8).fillColor('#94a3b8').text('Thank you for choosing Alliance Car Rental.', { align: 'center' });

  doc.end();
};
