/**
 * Money helpers. Amounts are integer minor units (paise, cents) with an ISO 4217 currency code.
 * No floating point money anywhere in the app.
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  /** Number of decimal digits in the minor unit (INR: 2, JPY: 0). */
  decimals: number;
  /** Use lakh/crore grouping (1,00,000) instead of thousands grouping. */
  indicGrouping: boolean;
}

const CURRENCIES: Record<string, CurrencyInfo> = {
  INR: { code: 'INR', symbol: '₹', decimals: 2, indicGrouping: true },
  USD: { code: 'USD', symbol: '$', decimals: 2, indicGrouping: false },
  GBP: { code: 'GBP', symbol: '£', decimals: 2, indicGrouping: false },
  EUR: { code: 'EUR', symbol: '€', decimals: 2, indicGrouping: false },
  AED: { code: 'AED', symbol: 'د.إ', decimals: 2, indicGrouping: false },
  CAD: { code: 'CAD', symbol: 'CA$', decimals: 2, indicGrouping: false },
  AUD: { code: 'AUD', symbol: 'A$', decimals: 2, indicGrouping: false },
  SGD: { code: 'SGD', symbol: 'S$', decimals: 2, indicGrouping: false },
  JPY: { code: 'JPY', symbol: '¥', decimals: 0, indicGrouping: false },
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCIES);

export function currencyInfo(code: string): CurrencyInfo {
  return CURRENCIES[code] ?? { code, symbol: code + ' ', decimals: 2, indicGrouping: false };
}

/** Insert group separators into a string of digits. */
export function groupDigits(intPart: string, indic: boolean): string {
  if (intPart.length <= 3) return intPart;
  if (!indic) return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  // Indic: last three digits, then groups of two.
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const restGrouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${restGrouped},${last3}`;
}

export interface FormatOptions {
  /** Omit decimals when they are zero (₹1,001 instead of ₹1,001.00). Default true. */
  compactDecimals?: boolean;
  /** Prefix with an explicit sign for positive amounts. Default false. */
  showPlus?: boolean;
}

export function formatMoney(amountMinor: number, currency: string, opts: FormatOptions = {}): string {
  const { compactDecimals = true, showPlus = false } = opts;
  const info = currencyInfo(currency);
  const negative = amountMinor < 0;
  const abs = Math.abs(Math.trunc(amountMinor));
  const factor = 10 ** info.decimals;
  const intPart = Math.floor(abs / factor).toString();
  const fracPart = (abs % factor).toString().padStart(info.decimals, '0');
  const grouped = groupDigits(intPart, info.indicGrouping);
  const showFrac = info.decimals > 0 && !(compactDecimals && /^0+$/.test(fracPart));
  const body = showFrac ? `${grouped}.${fracPart}` : grouped;
  const sign = negative ? '-' : showPlus && amountMinor > 0 ? '+' : '';
  return `${sign}${info.symbol}${body}`;
}

/**
 * Parse user-typed major units ("1,001", "1001.50", "₹ 2,100") into minor units.
 * Returns null for empty or invalid input.
 */
export function parseMoney(input: string, currency: string): number | null {
  const info = currencyInfo(currency);
  const cleaned = input.replace(/[^\d.\-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(cleaned);
  if (!match) return null;
  const [, sign, intStr, fracStr = ''] = match;
  if (intStr === '' && fracStr === '') return null;
  const factor = 10 ** info.decimals;
  const intMinor = (intStr === '' ? 0 : Number(intStr)) * factor;
  const fracPadded = (fracStr + '0'.repeat(info.decimals)).slice(0, info.decimals);
  const fracMinor = info.decimals === 0 ? 0 : Number(fracPadded);
  const total = intMinor + fracMinor;
  if (!Number.isSafeInteger(total)) return null;
  return sign === '-' ? -total : total;
}

/** Convert minor units to a plain editable string of major units, e.g. 100100 -> "1001". */
export function toMajorString(amountMinor: number, currency: string): string {
  const info = currencyInfo(currency);
  const factor = 10 ** info.decimals;
  const abs = Math.abs(amountMinor);
  const int = Math.floor(abs / factor);
  const frac = abs % factor;
  const sign = amountMinor < 0 ? '-' : '';
  if (info.decimals === 0 || frac === 0) return `${sign}${int}`;
  return `${sign}${int}.${frac.toString().padStart(info.decimals, '0').replace(/0+$/, '')}`;
}
