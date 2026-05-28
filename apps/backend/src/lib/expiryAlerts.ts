const DAY_MS = 24 * 60 * 60 * 1000;
export const EXPIRY_WINDOW_DAYS = 30;

export const expiryThresholdFrom = (now: Date) => new Date(now.getTime() + EXPIRY_WINDOW_DAYS * DAY_MS);

const daysUntil = (d: Date, now: Date) => Math.ceil((d.getTime() - now.getTime()) / DAY_MS);

export const expiryDetail = (d: Date, now: Date) => {
  const days = daysUntil(d, now);
  return days < 0 ? `Expired ${Math.abs(days)}d ago` : `Expires in ${days}d`;
};

export interface CarExpiryFields {
  insuranceExpiry: Date | null;
  pollutionExpiry: Date | null;
  rcExpiry: Date | null;
}

export interface DocExpiry {
  kind: 'INSURANCE' | 'POLLUTION' | 'RC';
  date: Date;
  detail: string;
  expired: boolean;
}

// Documents (insurance/pollution/RC) of one car that are expiring within the
// window or already expired, with a human-readable detail string.
export const carDocumentExpiries = (car: CarExpiryFields, now: Date): DocExpiry[] => {
  const threshold = expiryThresholdFrom(now);
  const out: DocExpiry[] = [];
  const check = (date: Date | null, kind: DocExpiry['kind'], label: string) => {
    if (date && date <= threshold) out.push({ kind, date, detail: `${label} ${expiryDetail(date, now)}`, expired: date < now });
  };
  check(car.insuranceExpiry, 'INSURANCE', 'Insurance');
  check(car.pollutionExpiry, 'POLLUTION', 'Pollution');
  check(car.rcExpiry, 'RC', 'RC');
  return out;
};
