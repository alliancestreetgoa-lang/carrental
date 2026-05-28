import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number | string) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(amount));

export const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));

// Compact INR for chart axes, e.g. 18000 -> "₹18k".
export const formatAxisCurrency = (value: number | string) => `₹${Number(value) / 1000}k`;

// ISO date (yyyy-mm-dd) for <input type="date">; defaults to today when empty.
export const toDateInput = (v?: string | null) =>
  (v ? new Date(v) : new Date()).toISOString().slice(0, 10);

// Shared native-<select> styling.
export const selectClass =
  'h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer dark:bg-input/30';
export const formSelectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer dark:bg-input/30';
