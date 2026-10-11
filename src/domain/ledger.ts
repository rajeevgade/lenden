import type { Entry, EntryWithEvent, EventType } from './types';

export interface CurrencyTotals {
  currency: string;
  gaveMinor: number;
  receivedMinor: number;
  /** received - gave. Positive means they have given us more than we have given them. */
  netMinor: number;
  gaveCount: number;
  receivedCount: number;
}

/** Value of an entry for totals: cash amount, or estimated value of an item (0 if unknown). */
export function entryValueMinor(entry: Pick<Entry, 'amountMinor'>): number {
  return entry.amountMinor ?? 0;
}

/**
 * Totals per currency. Items without an estimated value count toward counts but not sums.
 * Output is sorted by currency code for stable rendering.
 */
export type LedgerEntry = Pick<Entry, 'direction' | 'amountMinor' | 'currency'>;

export function totalsByCurrency(entries: ReadonlyArray<LedgerEntry>): CurrencyTotals[] {
  const map = new Map<string, CurrencyTotals>();
  for (const e of entries) {
    let t = map.get(e.currency);
    if (!t) {
      t = { currency: e.currency, gaveMinor: 0, receivedMinor: 0, netMinor: 0, gaveCount: 0, receivedCount: 0 };
      map.set(e.currency, t);
    }
    const v = entryValueMinor(e);
    if (e.direction === 'gave') {
      t.gaveMinor += v;
      t.gaveCount += 1;
    } else {
      t.receivedMinor += v;
      t.receivedCount += 1;
    }
    t.netMinor = t.receivedMinor - t.gaveMinor;
  }
  return [...map.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

/** The totals for the currency with the most entries — what the list screens show as a single chip. */
export function primaryTotals(entries: ReadonlyArray<LedgerEntry>): CurrencyTotals | null {
  const all = totalsByCurrency(entries);
  if (all.length === 0) return null;
  return all.reduce((best, t) =>
    t.gaveCount + t.receivedCount > best.gaveCount + best.receivedCount ? t : best,
  );
}

/** Sort entries newest event first, then newest created first. */
export function sortByEventDateDesc<T extends EntryWithEvent>(entries: ReadonlyArray<T>): T[] {
  return [...entries].sort((a, b) => {
    if (a.event.date !== b.event.date) return a.event.date < b.event.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
  });
}

export interface EventGroup<T extends EntryWithEvent> {
  event: T['event'];
  entries: T[];
}

/** Group a family's entries by event, newest event first. */
export function groupByEvent<T extends EntryWithEvent>(entries: ReadonlyArray<T>): EventGroup<T>[] {
  const sorted = sortByEventDateDesc(entries);
  const groups: EventGroup<T>[] = [];
  const index = new Map<string, EventGroup<T>>();
  for (const e of sorted) {
    let g = index.get(e.event.id);
    if (!g) {
      g = { event: e.event, entries: [] };
      index.set(e.event.id, g);
      groups.push(g);
    }
    g.entries.push(e);
  }
  return groups;
}

export function lastEntry<T extends EntryWithEvent>(
  entries: ReadonlyArray<T>,
  direction: Entry['direction'],
): T | null {
  const sorted = sortByEventDateDesc(entries.filter((e) => e.direction === direction));
  return sorted[0] ?? null;
}

export interface Suggestion {
  /** The entry we are basing the suggestion on. */
  basis: EntryWithEvent;
  /** Whether the basis came from the same kind of event. */
  sameEventType: boolean;
}

/**
 * What should we give this family next? Based on the most recent thing they gave us,
 * preferring an entry from the same type of event (a wedding gift as a reference for a wedding).
 */
export function suggestGift(
  entries: ReadonlyArray<EntryWithEvent>,
  eventType: EventType | null,
): Suggestion | null {
  const received = sortByEventDateDesc(entries.filter((e) => e.direction === 'received'));
  if (received.length === 0) return null;
  if (eventType) {
    const same = received.find((e) => e.event.type === eventType);
    if (same) return { basis: same, sameEventType: true };
  }
  return { basis: received[0], sameEventType: false };
}

/**
 * Round an amount up to the customary "shagun" ending (…01) in the given currency's major unit:
 * 2000 -> 2001, 2001 -> 2001, 2050 -> 2101. Only meaningful for whole-rupee conventions;
 * callers decide whether to apply it.
 */
export function roundToAuspicious(amountMinor: number, decimals: number): number {
  const factor = 10 ** decimals;
  const major = Math.ceil(amountMinor / factor);
  const remainder = major % 100;
  const base = major - remainder;
  const candidate = remainder <= 1 ? base + 1 : base + 101;
  return candidate * factor;
}
