import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  totalsByCurrency,
  primaryTotals,
  groupByEvent,
  suggestGift,
  lastEntry,
  roundToAuspicious,
} from '../ledger';
import type { EntryWithEvent, EventType } from '../types';

let seq = 0;
function entry(
  o: Partial<EntryWithEvent> & { direction: 'gave' | 'received'; amount: number | null; date: string; type?: EventType },
): EntryWithEvent {
  seq += 1;
  const eventId = o.event?.id ?? `ev-${o.date}-${o.type ?? 'other'}`;
  return {
    id: `e${seq}`,
    familyId: 'fam1',
    eventId,
    direction: o.direction,
    kind: o.amount === null ? 'item' : 'cash',
    amountMinor: o.amount,
    currency: o.currency ?? 'INR',
    itemDescription: o.amount === null ? 'saree' : null,
    photoPath: null,
    note: null,
    createdAt: `2020-01-01T00:00:${String(seq).padStart(2, '0')}Z`,
    updatedAt: '2020-01-01T00:00:00Z',
    event: { id: eventId, name: 'ev', type: o.type ?? 'other', date: o.date, hostFamilyId: null },
  };
}

test('totalsByCurrency sums per currency and direction', () => {
  const t = totalsByCurrency([
    entry({ direction: 'gave', amount: 100100, date: '2023-01-01' }),
    entry({ direction: 'received', amount: 210000, date: '2024-01-01' }),
    entry({ direction: 'received', amount: null, date: '2024-01-01' }),
    entry({ direction: 'gave', amount: 5000, date: '2024-01-01', currency: 'USD' }),
  ]);
  assert.equal(t.length, 2);
  const inr = t.find((x) => x.currency === 'INR')!;
  assert.equal(inr.gaveMinor, 100100);
  assert.equal(inr.receivedMinor, 210000);
  assert.equal(inr.netMinor, 109900);
  assert.equal(inr.receivedCount, 2);
  const usd = t.find((x) => x.currency === 'USD')!;
  assert.equal(usd.netMinor, -5000);
});

test('primaryTotals picks the currency with the most entries', () => {
  const p = primaryTotals([
    entry({ direction: 'gave', amount: 1, date: '2023-01-01', currency: 'USD' }),
    entry({ direction: 'gave', amount: 1, date: '2023-01-01' }),
    entry({ direction: 'gave', amount: 1, date: '2023-01-01' }),
  ]);
  assert.equal(p?.currency, 'INR');
  assert.equal(primaryTotals([]), null);
});

test('groupByEvent orders newest event first and keeps entries together', () => {
  const g = groupByEvent([
    entry({ direction: 'gave', amount: 1, date: '2021-05-01', type: 'wedding' }),
    entry({ direction: 'received', amount: 2, date: '2024-02-10', type: 'housewarming' }),
    entry({ direction: 'gave', amount: 3, date: '2021-05-01', type: 'wedding' }),
  ]);
  assert.equal(g.length, 2);
  assert.equal(g[0].event.date, '2024-02-10');
  assert.equal(g[1].entries.length, 2);
});

test('suggestGift prefers same event type, falls back to most recent received', () => {
  const entries = [
    entry({ direction: 'received', amount: 210000, date: '2023-03-01', type: 'wedding' }),
    entry({ direction: 'received', amount: 50100, date: '2024-06-01', type: 'birthday' }),
    entry({ direction: 'gave', amount: 999999, date: '2025-01-01', type: 'wedding' }),
  ];
  const wedding = suggestGift(entries, 'wedding');
  assert.equal(wedding?.basis.amountMinor, 210000);
  assert.equal(wedding?.sameEventType, true);

  const puja = suggestGift(entries, 'puja');
  assert.equal(puja?.basis.amountMinor, 50100);
  assert.equal(puja?.sameEventType, false);

  assert.equal(suggestGift(entries.filter((e) => e.direction === 'gave'), 'wedding'), null);
});

test('lastEntry', () => {
  const entries = [
    entry({ direction: 'gave', amount: 1, date: '2022-01-01' }),
    entry({ direction: 'gave', amount: 2, date: '2023-01-01' }),
  ];
  assert.equal(lastEntry(entries, 'gave')?.amountMinor, 2);
  assert.equal(lastEntry(entries, 'received'), null);
});

test('roundToAuspicious', () => {
  assert.equal(roundToAuspicious(200000, 2), 200100);
  assert.equal(roundToAuspicious(200100, 2), 200100);
  assert.equal(roundToAuspicious(205000, 2), 210100);
  assert.equal(roundToAuspicious(50000, 2), 50100);
  assert.equal(roundToAuspicious(100, 2), 100);
  assert.equal(roundToAuspicious(5000, 0), 5001);
});
