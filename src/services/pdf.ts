import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatISODate, todayISO } from '../domain/dates';
import { totalsByCurrency } from '../domain/ledger';
import { formatMoney } from '../domain/money';
import type { Entry, EntryWithEvent, EntryWithFamily, Family } from '../domain/types';
import type { EventListItem } from '../db';
import { t } from '../i18n';

function esc(s: string | null | undefined): string {
  return (s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);
}

function giftCell(e: Entry): string {
  if (e.kind === 'cash') return e.amountMinor == null ? '' : esc(formatMoney(e.amountMinor, e.currency));
  const value = e.amountMinor == null ? '' : ` (≈ ${esc(formatMoney(e.amountMinor, e.currency))})`;
  return `${esc(e.itemDescription)}${value}`;
}

function totalsRows(entries: Entry[]): string {
  return totalsByCurrency(entries)
    .map(
      (tt) =>
        `<tr><td>${tt.currency}</td><td class="num">${esc(formatMoney(tt.gaveMinor, tt.currency))}</td><td class="num">${esc(
          formatMoney(tt.receivedMinor, tt.currency),
        )}</td><td class="num">${esc(formatMoney(tt.netMinor, tt.currency, { showPlus: true }))}</td></tr>`,
    )
    .join('');
}

function shell(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #2A1B12; padding: 24px; font-size: 13px; }
    h1 { font-size: 22px; margin: 0 0 4px; color: #8E1B3A; }
    .sub { color: #7A6A5C; margin-bottom: 18px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #7A6A5C; border-bottom: 2px solid #E6DCC9; padding: 6px 4px; }
    td { border-bottom: 1px solid #E6DCC9; padding: 7px 4px; vertical-align: top; }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .gave { color: #B4462B; } .received { color: #2E7D5B; }
    h2 { font-size: 14px; margin: 18px 0 6px; }
  </style></head><body>${body}</body></html>`;
}

/** Title → file name the share sheet and Files app will show. Drops characters iOS/Android paths reject. */
function pdfFileName(title: string): string {
  const base = title.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim() || 'LenDen';
  return `${base}.pdf`;
}

async function printAndShare(html: string, title: string): Promise<void> {
  const { uri: printed } = await Print.printToFileAsync({ html });
  // expo-print names the file with a UUID; rename it so the shared file reads like the document.
  const uri = `${FileSystem.cacheDirectory}${encodeURIComponent(pdfFileName(title))}`;
  await FileSystem.deleteAsync(uri, { idempotent: true });
  await FileSystem.moveAsync({ from: printed, to: uri });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}

export async function exportFamilyLedgerPdf(family: Family, entries: EntryWithEvent[]): Promise<void> {
  const title = t.pdf.familyLedger(family.name);
  const rows = entries
    .map(
      (e) => `<tr>
        <td>${esc(e.event.name)}</td>
        <td>${esc(formatISODate(e.event.date))}</td>
        <td class="${e.direction}">${esc(e.direction === 'gave' ? t.direction.gaveShort : t.direction.receivedShort)}</td>
        <td class="num ${e.direction}">${giftCell(e)}</td>
        <td>${esc(e.note)}</td></tr>`,
    )
    .join('');
  const body = `<h1>${esc(title)}</h1>
    <div class="sub">${esc([family.relation, family.city].filter(Boolean).join(' · '))}<br/>${esc(t.pdf.generatedOn(formatISODate(todayISO())))}</div>
    <table><thead><tr><th>${t.pdf.colEvent}</th><th>${t.pdf.colDate}</th><th>${t.pdf.colDirection}</th><th class="num">${t.pdf.colGift}</th><th>${t.pdf.colNote}</th></tr></thead><tbody>${rows}</tbody></table>
    <h2>${t.pdf.totals}</h2>
    <table><thead><tr><th></th><th class="num">${t.direction.gaveShort}</th><th class="num">${t.direction.receivedShort}</th><th class="num">${t.family.net}</th></tr></thead><tbody>${totalsRows(entries)}</tbody></table>`;
  await printAndShare(shell(title, body), title);
}

export async function exportEventPdf(event: EventListItem, entries: EntryWithFamily[]): Promise<void> {
  const title = t.pdf.eventList(event.name);
  const sorted = [...entries].sort((a, b) => a.family.name.localeCompare(b.family.name));
  const rows = sorted
    .map(
      (e) => `<tr>
        <td>${esc(e.family.name)}${e.family.city ? `<br/><small>${esc(e.family.city)}</small>` : ''}</td>
        <td class="${e.direction}">${esc(e.direction === 'gave' ? t.direction.gaveShort : t.direction.receivedShort)}</td>
        <td class="num ${e.direction}">${giftCell(e)}</td>
        <td>${esc(e.note)}</td></tr>`,
    )
    .join('');
  const body = `<h1>${esc(title)}</h1>
    <div class="sub">${esc(formatISODate(event.date))}${event.hostFamilyName ? ` · ${esc(t.events.hostedBy(event.hostFamilyName))}` : ` · ${esc(t.events.ourEvent)}`}<br/>${esc(
      t.pdf.generatedOn(formatISODate(todayISO())),
    )}</div>
    <table><thead><tr><th>${t.pdf.colFamily}</th><th>${t.pdf.colDirection}</th><th class="num">${t.pdf.colGift}</th><th>${t.pdf.colNote}</th></tr></thead><tbody>${rows}</tbody></table>
    <h2>${t.pdf.totals}</h2>
    <table><thead><tr><th></th><th class="num">${t.direction.gaveShort}</th><th class="num">${t.direction.receivedShort}</th><th class="num">${t.family.net}</th></tr></thead><tbody>${totalsRows(entries)}</tbody></table>`;
  await printAndShare(shell(title, body), title);
}
