import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { company } from '../config/company';

interface Row {
  label: string;
  registrationNumber: string;
  revenue: number;
  expenses: number;
  profit: number;
  bookings: number;
  utilization: number;
  idle: boolean;
}
interface ProfitReport {
  from: string;
  to: string;
  totals: { revenue: number; expenses: number; profit: number };
  cars: Row[];
}

const inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (n: number) => `Rs. ${inr.format(n)}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

export const streamProfitReportPdf = (res: Response, r: ProfitReport) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="profit-per-car-${r.from.slice(0, 10)}_${r.to.slice(0, 10)}.pdf"`);
  doc.pipe(res);

  // Header band
  doc.rect(0, 0, doc.page.width, 70).fill(company.darkColor);
  doc.rect(0, 70, doc.page.width, 4).fill(company.primaryColor);
  doc.fillColor('#ffffff').fontSize(18).text(company.name, 50, 22);
  doc.fontSize(10).fillColor('#cbd5e1').text('Profit Per Car Report', 50, 46);

  doc.fillColor('#94a3b8').fontSize(9).text(`Period: ${fmtDate(r.from)} — ${fmtDate(r.to)}`, 50, 90);
  doc.text(`Generated: ${fmtDate(new Date().toISOString())}`, 50, 102);

  // Totals
  let y = 124;
  doc.fontSize(10).fillColor('#0f172a');
  doc.text(`Total Revenue: ${money(r.totals.revenue)}`, 50, y);
  doc.text(`Total Expenses: ${money(r.totals.expenses)}`, 230, y);
  doc.fillColor(r.totals.profit >= 0 ? '#059669' : '#dc2626').text(`Net Profit: ${money(r.totals.profit)}`, 410, y);

  // Table header
  y = 156;
  const cols = { car: 50, util: 250, rev: 310, exp: 400, profit: 490 };
  doc.fillColor('#64748b').fontSize(8.5);
  doc.text('Vehicle', cols.car, y);
  doc.text('Util%', cols.util, y);
  doc.text('Revenue', cols.rev, y, { width: 80, align: 'right' });
  doc.text('Expenses', cols.exp, y, { width: 80, align: 'right' });
  doc.text('Profit', cols.profit, y, { width: 55, align: 'right' });
  y += 14;
  doc.moveTo(50, y - 3).lineTo(545, y - 3).strokeColor('#e2e8f0').stroke();

  doc.fontSize(8.5);
  for (const c of r.cars) {
    if (y > 770) { doc.addPage(); y = 50; }
    doc.fillColor('#0f172a').text(`${c.label}`, cols.car, y, { width: 195 });
    doc.fillColor('#475569').fontSize(7).text(c.registrationNumber, cols.car, y + 10, { width: 195 });
    doc.fontSize(8.5).fillColor('#334155');
    doc.text(`${c.utilization}%`, cols.util, y);
    doc.text(inr.format(c.revenue), cols.rev, y, { width: 80, align: 'right' });
    doc.text(inr.format(c.expenses), cols.exp, y, { width: 80, align: 'right' });
    doc.fillColor(c.profit >= 0 ? '#059669' : '#dc2626').text(inr.format(c.profit), cols.profit, y, { width: 55, align: 'right' });
    y += 22;
  }

  doc.fontSize(8).fillColor('#94a3b8').text(company.name, 50, 800, { align: 'center', width: 495 });
  doc.end();
};
