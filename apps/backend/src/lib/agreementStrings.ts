// Multi-language strings for the rental agreement PDF.
// Add a new locale by extending this map; the PDF generator falls back to `en`.
// NOTE: PDFKit's built-in fonts cover Latin scripts. For non-Latin languages
// (e.g. Hindi/Arabic) register a TTF via doc.registerFont() before use.

export type Lang = 'en' | 'es';

export interface AgreementStrings {
  title: string;
  agreementNo: string;
  date: string;
  lessor: string;
  lessee: string;
  vehicle: string;
  rentalTerms: string;
  charges: string;
  termsTitle: string;
  terms: string[];
  labels: {
    mobile: string; email: string; licence: string; address: string;
    registration: string; chassis: string; pickup: string; ret: string; days: string;
    pickupLoc: string; dropLoc: string;
    dailyRate: string; rentSubtotal: string; lateFee: string; securityDeposit: string;
    grandTotal: string; paid: string; balanceDue: string;
  };
  lesseeSignature: string;
  lessorSignature: string;
  signedBy: string;
  notSigned: string;
  thanks: string;
}

const en: AgreementStrings = {
  title: 'Vehicle Rental Agreement',
  agreementNo: 'Agreement No',
  date: 'Date',
  lessor: 'Lessor',
  lessee: 'Lessee',
  vehicle: 'Vehicle',
  rentalTerms: 'Rental Period',
  charges: 'Charges',
  termsTitle: 'Terms & Conditions',
  terms: [
    'The Lessee confirms they hold a valid driving licence and are legally permitted to operate the vehicle.',
    'The vehicle must be returned by the agreed return date and time; late returns incur a late fee equal to the daily rate per extra day.',
    'The security deposit is refundable on return, subject to deductions for damage, fines, or fuel shortfalls.',
    'The Lessee is responsible for all traffic violations, tolls and fines during the rental period.',
    'The vehicle shall not be sub-let, used for racing, or driven under the influence of alcohol or drugs.',
    'Any damage, accident or theft must be reported to the Lessor immediately.',
  ],
  labels: {
    mobile: 'Mobile', email: 'Email', licence: 'Licence', address: 'Address',
    registration: 'Registration', chassis: 'Chassis', pickup: 'Pickup', ret: 'Return', days: 'Days',
    pickupLoc: 'Pickup Location', dropLoc: 'Drop Location',
    dailyRate: 'Daily rate', rentSubtotal: 'Rental subtotal', lateFee: 'Late fee', securityDeposit: 'Security deposit (refundable)',
    grandTotal: 'Total payable', paid: 'Paid', balanceDue: 'Balance due',
  },
  lesseeSignature: 'Lessee Signature',
  lessorSignature: 'For Alliance Car Rental',
  signedBy: 'Signed by',
  notSigned: 'Not yet signed',
  thanks: 'Thank you for choosing Alliance Car Rental.',
};

const es: AgreementStrings = {
  title: 'Contrato de Alquiler de Vehículo',
  agreementNo: 'Nº de Contrato',
  date: 'Fecha',
  lessor: 'Arrendador',
  lessee: 'Arrendatario',
  vehicle: 'Vehículo',
  rentalTerms: 'Período de Alquiler',
  charges: 'Cargos',
  termsTitle: 'Términos y Condiciones',
  terms: [
    'El Arrendatario confirma que posee una licencia de conducir válida y está legalmente autorizado para operar el vehículo.',
    'El vehículo debe devolverse en la fecha y hora acordadas; las devoluciones tardías generan un recargo igual a la tarifa diaria por cada día adicional.',
    'El depósito de seguridad es reembolsable a la devolución, sujeto a deducciones por daños, multas o falta de combustible.',
    'El Arrendatario es responsable de todas las infracciones de tránsito, peajes y multas durante el período de alquiler.',
    'El vehículo no podrá subarrendarse, usarse para carreras ni conducirse bajo los efectos del alcohol o las drogas.',
    'Cualquier daño, accidente o robo debe informarse al Arrendador de inmediato.',
  ],
  labels: {
    mobile: 'Móvil', email: 'Correo', licence: 'Licencia', address: 'Dirección',
    registration: 'Matrícula', chassis: 'Chasis', pickup: 'Recogida', ret: 'Devolución', days: 'Días',
    pickupLoc: 'Lugar de recogida', dropLoc: 'Lugar de entrega',
    dailyRate: 'Tarifa diaria', rentSubtotal: 'Subtotal alquiler', lateFee: 'Recargo por demora', securityDeposit: 'Depósito de seguridad (reembolsable)',
    grandTotal: 'Total a pagar', paid: 'Pagado', balanceDue: 'Saldo pendiente',
  },
  lesseeSignature: 'Firma del Arrendatario',
  lessorSignature: 'Por Alliance Car Rental',
  signedBy: 'Firmado por',
  notSigned: 'Aún sin firmar',
  thanks: 'Gracias por elegir Alliance Car Rental.',
};

const MAP: Record<Lang, AgreementStrings> = { en, es };

export const getStrings = (lang?: string): AgreementStrings => MAP[(lang as Lang)] ?? en;
export const supportedLangs: Lang[] = ['en', 'es'];
